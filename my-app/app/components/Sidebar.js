'use client';

import { useState } from 'react';

export default function Sidebar({ 
  selectedAgent, 
  onAgentChange, 
  onClearChat, 
  onNewChat, 
  chatHistory = [], 
  onChatSelect,
  isSidebarOpen,
  onToggleSidebar,
  selectedModel,
  onModelChange 
}) {
  const userAgents = {
    general: {
      name: '🤖 General Assistant',
      description: 'Helpful AI assistant for general questions',
      color: 'from-blue-500 to-purple-600'
    },
    coding: {
      name: '💻 Code Expert',
      description: 'Specialized in programming and development',
      color: 'from-green-500 to-teal-600'
    },
    creative: {
      name: '🎨 Creative Writer',
      description: 'Creative writing and storytelling specialist',
      color: 'from-pink-500 to-purple-600'
    },
    business: {
      name: '📊 Business Advisor',
      description: 'Business strategy and professional guidance',
      color: 'from-orange-500 to-red-600'
    },
    science: {
      name: '🔬 Science Expert',
      description: 'Scientific research and technical analysis',
      color: 'from-cyan-500 to-blue-600'
    },
    casual: {
      name: '😊 Casual Friend',
      description: 'Friendly conversational companion',
      color: 'from-yellow-500 to-orange-600'
    },
    maps: {
      name: '🗺️ Maps Assistant',
      description: 'Navigation, routes, and location-based assistance',
      color: 'from-green-500 to-blue-600'
    }
  };

  return (
    <div className={`${
      isSidebarOpen ? 'w-80' : 'w-0'
    } transition-all duration-300 bg-gray-900 text-white flex flex-col overflow-hidden border-r border-gray-700`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">AI Assistant</h1>
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning={true}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning={true}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Agent Selection */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Select Agent</h3>
        <select
          value={selectedAgent}
          onChange={(e) => onAgentChange(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(userAgents).map(([id, agent]) => (
            <option key={id} value={id}>
              {agent.name}
            </option>
          ))}
        </select>
        
        {/* Current Agent Info */}
        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
          <div className={`w-8 h-8 bg-gradient-to-r ${userAgents[selectedAgent].color} rounded-full flex items-center justify-center mb-2`}>
            <span className="text-white font-bold text-sm">{userAgents[selectedAgent].name.split(' ')[0]}</span>
          </div>
          <div className="text-sm font-medium">{userAgents[selectedAgent].name}</div>
          <div className="text-xs text-gray-400 mt-1">{userAgents[selectedAgent].description}</div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-3">AI Model</h3>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="meta/Meta-Llama-3.1-8B-Instruct">🦙 Llama 3.1 8B (Working)</option>
          <option value="microsoft/Phi-3.5-mini-instruct">💫 Phi-3.5 Mini</option>
          <option value="meta/Meta-Llama-3.1-70B-Instruct">🦙 Llama 3.1 70B</option>
          <option value="microsoft/Phi-3-medium-4k-instruct">💫 Phi-3 Medium</option>
        </select>
        <div className="mt-2 text-xs text-gray-400">
          {selectedModel === 'meta/Meta-Llama-3.1-8B-Instruct' && 'Fast, capable open-source model (confirmed working)'}
          {selectedModel === 'microsoft/Phi-3.5-mini-instruct' && 'Compact and efficient Microsoft model'}
          {selectedModel === 'meta/Meta-Llama-3.1-70B-Instruct' && 'Larger, more capable Llama model'}
          {selectedModel === 'microsoft/Phi-3-medium-4k-instruct' && 'Medium-sized Microsoft model'}
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Chats</h3>
          {chatHistory.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No chat history yet
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat, index) => (
                <button
                  key={index}
                  onClick={() => onChatSelect(chat)}
                  className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group relative"
                >
                  <div className="text-sm font-medium truncate pr-6">{chat.title}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                    <span>{chat.agent} • {chat.timestamp}</span>
                    <span className="text-xs bg-gray-700 px-1 rounded">{chat.model?.split('/')[1]?.split('-')[0] || 'Model'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onClearChat}
          className="w-full p-2 text-sm bg-red-900 hover:bg-red-800 text-red-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning={true}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear Chat</span>
        </button>
      </div>
    </div>
  );
}