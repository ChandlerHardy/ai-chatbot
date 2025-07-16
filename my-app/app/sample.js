import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "meta/Meta-Llama-3.1-8B-Instruct";

export async function main() {

  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set. Please set it before running this script.");
  }

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Give me 5 good reasons why I should exercise every day." },
      ],
      model: modelName,
      stream: true,
      max_tokens: 500, // Increase token limit
      model_extras: {stream_options: {include_usage: true}}
    }
  }).asNodeStream();

  if (!response.body) {
    throw new Error("The response is undefined");
  }

  const sseStream = createSseStream(response.body);

  var usage = null;
  for await (const event of sseStream) {
    if (event.data === "[DONE]") {
      break;
    }
    
    try {
      var parsedData = JSON.parse(event.data);
      
      for (const choice of parsedData.choices) {
          process.stdout.write(choice.delta?.content ?? ``);
      }
      if (parsedData.usage){
        usage = parsedData.usage
      }
    } catch (error) {
      console.error("Error parsing event data:", error);
    }
  }
  if (usage)
  {
    process.stdout.write("\n");
    for (var k in usage)
    {
      process.stdout.write(`${k} = ${usage[k]}\n`);
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});