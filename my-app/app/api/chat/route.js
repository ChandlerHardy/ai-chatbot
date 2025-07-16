import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const modelName = "meta/Meta-Llama-3.1-8B-Instruct";

export async function POST(request) {
  try {
    if (!token) {
      return new Response(JSON.stringify({ error: "GITHUB_TOKEN not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages } = await request.json();

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Be conversational, friendly, and helpful in your responses." },
          ...messages
        ],
        model: modelName,
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
        model_extras: { stream_options: { include_usage: true } }
      }
    }).asNodeStream();

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
