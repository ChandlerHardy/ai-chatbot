import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";

export async function POST(request) {
  try {
    if (!token) {
      return new Response(JSON.stringify({ error: "GITHUB_TOKEN not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, agent, model, systemPrompt, mapData } = await request.json();
    
    // Use provided model or fall back to default
    const modelName = model || "meta/Meta-Llama-3.1-8B-Instruct";
    
    console.log(`Using model: ${modelName}`);

    // Use the provided system prompt or fall back to default
    const finalSystemPrompt = systemPrompt || "You are a helpful AI assistant. Be conversational, friendly, and helpful in your responses.";

    // Add map context if available
    let contextualSystemPrompt = finalSystemPrompt;
    if (mapData && agent === 'maps') {
      contextualSystemPrompt += `\n\nYou have access to the following map data:`;
      
      if (mapData.origin) {
        contextualSystemPrompt += `\nOrigin: ${mapData.origin.address || 'Current location'}`;
      }
      
      if (mapData.destination) {
        contextualSystemPrompt += `\nDestination: ${mapData.destination.address}`;
      }
      
      if (mapData.routes && mapData.routes.length > 0) {
        contextualSystemPrompt += `\nAvailable routes:`;
        mapData.routes.forEach((route, index) => {
          contextualSystemPrompt += `\n- Route ${index + 1}: ${route.summary} (${route.duration_text}, ${route.distance_text})`;
        });
      }
      
      if (mapData.places && mapData.places.length > 0) {
        contextualSystemPrompt += `\nNearby places along the route:`;
        mapData.places.slice(0, 10).forEach(place => {
          contextualSystemPrompt += `\n- ${place.name} (${place.rating ? place.rating + '★' : 'No rating'}) - ${place.vicinity}`;
        });
      }
      
      if (mapData.traffic) {
        contextualSystemPrompt += `\nTraffic information:`;
        mapData.traffic.traffic_info.forEach((info, index) => {
          contextualSystemPrompt += `\n- Route ${index + 1}: ${info.duration_in_traffic.text} (${info.traffic_level} traffic, ${info.traffic_delay.text} delay)`;
        });
      }
    }

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: contextualSystemPrompt },
          ...messages
        ],
        model: modelName,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
        model_extras: { stream_options: { include_usage: true } }
      }
    }).asNodeStream();

    console.log(`API Response status: ${response.status}`);

    if (!response.body) {
      throw new Error("No response body received");
    }

    const sseStream = createSseStream(response.body);

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of sseStream) {
            if (event.data === "[DONE]") {
              controller.close();
              break;
            }

            try {
              const parsedData = JSON.parse(event.data);
              
              // Send the chunk to the client
              const chunk = JSON.stringify({
                type: 'chunk',
                data: parsedData
              }) + '\n';
              
              controller.enqueue(new TextEncoder().encode(chunk));
            } catch (parseError) {
              console.error("Error parsing event data:", parseError);
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
