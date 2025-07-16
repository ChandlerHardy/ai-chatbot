import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "meta/Meta-Llama-3.1-8B-Instruct";

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class ChatBot {
  constructor() {
    if (!token) {
      throw new Error("GITHUB_TOKEN environment variable is not set. Please set it before running this script.");
    }

    this.client = ModelClient(endpoint, new AzureKeyCredential(token));
    this.conversationHistory = [
      { role: "system", content: "You are a helpful AI assistant. Be conversational, friendly, and concise in your responses." }
    ];
    
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${colors.cyan}You: ${colors.reset}`
    });
  }

  async sendMessage(userInput) {
    // Add user message to conversation history
    this.conversationHistory.push({ role: "user", content: userInput });

    try {
      const response = await this.client.path("/chat/completions").post({
        body: {
          messages: this.conversationHistory,
          model: modelName,
          stream: true,
          max_tokens: 800,
          temperature: 0.7,
          model_extras: { stream_options: { include_usage: true } }
        }
      }).asNodeStream();

      if (!response.body) {
        throw new Error("The response is undefined");
      }

      const sseStream = createSseStream(response.body);
      
      // Print assistant prefix
      process.stdout.write(`${colors.green}Assistant: ${colors.reset}`);
      
      let assistantMessage = "";
      let usage = null;

      for await (const event of sseStream) {
        if (event.data === "[DONE]") {
          break;
        }

        try {
          const parsedData = JSON.parse(event.data);
          
          for (const choice of parsedData.choices) {
            const content = choice.delta?.content ?? '';
            if (content) {
              process.stdout.write(content);
              assistantMessage += content;
            }
          }
          
          if (parsedData.usage) {
            usage = parsedData.usage;
          }
        } catch (error) {
          console.error("Error parsing event data:", error);
        }
      }

      // Add assistant message to conversation history
      if (assistantMessage) {
        this.conversationHistory.push({ role: "assistant", content: assistantMessage });
      }

      // Print usage stats if available
      if (usage) {
        process.stdout.write(`\n${colors.yellow}[Tokens: ${usage.completion_tokens} completion, ${usage.prompt_tokens} prompt, ${usage.total_tokens} total]${colors.reset}\n`);
      }

      process.stdout.write('\n\n');

    } catch (error) {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }

  start() {
    console.log(`${colors.bright}${colors.blue}🤖 Terminal ChatBot${colors.reset}`);
    console.log(`${colors.yellow}Connected to: ${modelName}${colors.reset}`);
    console.log(`${colors.magenta}Type 'exit', 'quit', or press Ctrl+C to end the conversation${colors.reset}`);
    console.log(`${colors.magenta}Type 'clear' to clear conversation history${colors.reset}`);
    console.log(`${colors.magenta}Type 'history' to see conversation history${colors.reset}\n`);

    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const trimmedInput = input.trim();

      if (trimmedInput === 'exit' || trimmedInput === 'quit') {
        console.log(`${colors.green}Goodbye! 👋${colors.reset}`);
        this.rl.close();
        return;
      }

      if (trimmedInput === 'clear') {
        this.conversationHistory = [
          { role: "system", content: "You are a helpful AI assistant. Be conversational, friendly, and concise in your responses." }
        ];
        console.log(`${colors.yellow}Conversation history cleared!${colors.reset}\n`);
        this.rl.prompt();
        return;
      }

      if (trimmedInput === 'history') {
        console.log(`${colors.cyan}Conversation History:${colors.reset}`);
        this.conversationHistory.slice(1).forEach((msg, index) => {
          const color = msg.role === 'user' ? colors.cyan : colors.green;
          const role = msg.role === 'user' ? 'You' : 'Assistant';
          console.log(`${color}${role}: ${msg.content}${colors.reset}\n`);
        });
        this.rl.prompt();
        return;
      }

      if (trimmedInput === '') {
        this.rl.prompt();
        return;
      }

      await this.sendMessage(trimmedInput);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(`${colors.green}Chat session ended. Goodbye!${colors.reset}`);
      process.exit(0);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(`\n${colors.green}Goodbye! 👋${colors.reset}`);
      this.rl.close();
    });
  }
}

// Start the chatbot
const chatbot = new ChatBot();
chatbot.start();
