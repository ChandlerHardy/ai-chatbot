'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const messagesEndRef = useRef(null);

  // Define available user agents
  const userAgents = {
    general: {
      name: '🤖 General Assistant',
      description: 'Helpful AI assistant for general questions',
      systemPrompt: 'You are a helpful AI assistant. Be conversational, friendly, and helpful in your responses.',
      color: 'from-blue-500 to-purple-600'
    },
    coding: {
      name: '💻 Code Expert',
      description: 'Specialized in programming and development',
      systemPrompt: 'You are an expert software developer and programming assistant. Help with code, debugging, best practices, and technical questions. Provide clear, practical solutions with code examples when helpful.',
      color: 'from-green-500 to-teal-600'
    },
    creative: {
      name: '🎨 Creative Writer',
      description: 'Creative writing and storytelling specialist',
      systemPrompt: 'You are a creative writing assistant. Help with storytelling, creative writing, brainstorming ideas, character development, and artistic expression. Be imaginative, inspiring, and encouraging.',
      color: 'from-pink-500 to-purple-600'
    },
    business: {
      name: '📊 Business Advisor',
      description: 'Business strategy and professional guidance',
      systemPrompt: 'You are a business consultant and advisor. Help with business strategy, planning, marketing, productivity, and professional development. Provide practical, actionable advice.',
      color: 'from-orange-500 to-red-600'
    },
    science: {
      name: '🔬 Science Expert',
      description: 'Scientific research and technical analysis',
      systemPrompt: 'You are a scientific researcher and technical expert. Help with scientific concepts, research, analysis, and technical explanations. Be accurate, detailed, and educational.',
      color: 'from-cyan-500 to-blue-600'
    },
    casual: {
      name: '😊 Casual Friend',
      description: 'Friendly conversational companion',
      systemPrompt: 'You are a friendly, casual conversational companion. Be relaxed, fun, and engaging. Use a casual tone and help with everyday questions, casual conversations, and general life topics.',
      color: 'from-yellow-500 to-orange-600'
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the assistant's response
    const assistantMessage = { role: 'assistant', content: '', isStreaming: true };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          agent: selectedAgent,
          systemPrompt: userAgents[selectedAgent].systemPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === 'chunk' && parsed.data.choices?.[0]?.delta?.content) {
                assistantContent += parsed.data.choices[0].delta.content;
                
                // Update the last message (assistant's response)
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                    isStreaming: true
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: assistantContent,
          isStreaming: false
        };
        return updated;
      });

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          isStreaming: false,
          isError: true
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId);
    setMessages([]); // Clear messages when switching agents
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${userAgents[selectedAgent].color} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{userAgents[selectedAgent].name.split(' ')[0]}</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{userAgents[selectedAgent].name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userAgents[selectedAgent].description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Agent Selector */}
              <select
                value={selectedAgent}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(userAgents).map(([id, agent]) => (
                  <option key={id} value={id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <div className="text-6xl mb-4">{userAgents[selectedAgent].name.split(' ')[0]}</div>
              <h2 className="text-2xl font-semibold mb-2">Chat with {userAgents[selectedAgent].name}</h2>
              <p className="mb-4">{userAgents[selectedAgent].description}</p>
              <p className="text-sm">Ask me anything and I'll help you out!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isError
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && !message.isError && (
                      <span className="inline-block w-2 h-5 bg-gray-400 dark:bg-gray-500 ml-1 animate-pulse"></span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows="1"
                style={{ minHeight: '50px', maxHeight: '150px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Send</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
