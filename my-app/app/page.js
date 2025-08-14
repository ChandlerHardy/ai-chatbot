'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MapsPanel from './components/MapsPanel';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const messagesEndRef = useRef(null);

  // Map-related state
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [places, setPlaces] = useState([]);
  const [traffic, setTraffic] = useState(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('meta/Meta-Llama-3.1-8B-Instruct');
  const [currentChatId, setCurrentChatId] = useState(null);

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
    },
    maps: {
      name: '🗺️ Maps Assistant',
      description: 'Navigation, routes, and location-based assistance',
      systemPrompt: 'You are a maps and navigation assistant. Help users with directions, route planning, finding places along routes, traffic information, and location-based queries. You can analyze routes, suggest restaurants and points of interest, provide traffic updates, and answer questions about travel and navigation. Be helpful with specific location and travel advice.',
      color: 'from-green-500 to-blue-600'
    }
  };

  // Map helper functions
  const getDirections = async () => {
    if (!origin || !destination) return;
    
    setIsLoadingMap(true);
    try {
      const response = await fetch('/api/maps/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.address || `${origin.coordinates.lat},${origin.coordinates.lng}`,
          destination: destination.address || `${destination.coordinates.lat},${destination.coordinates.lng}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setRoutes(data.routes || []);
      } else {
        console.error('Error getting directions:', data.error);
      }
    } catch (error) {
      console.error('Error getting directions:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  const findPlacesAlongRoute = async (placeType = 'restaurant') => {
    if (routes.length === 0) return;

    setIsLoadingMap(true);
    try {
      // Get points along the route for searching
      const routePoints = [];
      if (origin?.coordinates) {
        routePoints.push(`${origin.coordinates.lat},${origin.coordinates.lng}`);
      }
      if (destination?.coordinates) {
        routePoints.push(`${destination.coordinates.lat},${destination.coordinates.lng}`);
      }

      const response = await fetch('/api/maps/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_points: routePoints,
          type: placeType,
          radius: 5000,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPlaces(data.places || []);
      } else {
        console.error('Error finding places:', data.error);
      }
    } catch (error) {
      console.error('Error finding places:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  const getTrafficInfo = async () => {
    if (!origin || !destination) return;

    setIsLoadingMap(true);
    try {
      const response = await fetch('/api/maps/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.address || `${origin.coordinates.lat},${origin.coordinates.lng}`,
          destination: destination.address || `${destination.coordinates.lat},${destination.coordinates.lng}`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTraffic(data);
      } else {
        console.error('Error getting traffic info:', data.error);
      }
    } catch (error) {
      console.error('Error getting traffic info:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  // Auto-update routes when origin/destination changes
  useEffect(() => {
    if (origin && destination) {
      getDirections();
    }
  }, [origin, destination]);

  // Auto-update traffic when routes change
  useEffect(() => {
    if (routes.length > 0) {
      getTrafficInfo();
    }
  }, [routes]);

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

    // Prepare map data for Maps agent
    const mapData = selectedAgent === 'maps' ? {
      origin,
      destination,
      routes,
      places,
      traffic
    } : undefined;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessages,
          agent: selectedAgent,
          model: selectedModel,
          systemPrompt: userAgents[selectedAgent].systemPrompt,
          mapData
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

      // Mark streaming as complete and save to history
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: assistantContent,
          isStreaming: false
        };
        
        // Auto-save chat after assistant response
        setTimeout(() => {
          saveChatToHistory(updated, selectedAgent, selectedModel);
        }, 100);
        
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

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  }, []);

  // Save chat to history
  const saveChatToHistory = (messages, agent, model) => {
    if (messages.length === 0) return;
    
    const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'New Chat';
    const title = firstUserMessage.length > 50 ? firstUserMessage.substring(0, 50) + '...' : firstUserMessage;
    
    const chatData = {
      id: currentChatId || Date.now().toString(),
      title,
      agent,
      model,
      messages,
      timestamp: new Date().toLocaleDateString(),
      mapData: selectedAgent === 'maps' ? { origin, destination, routes, places, traffic } : null
    };
    
    const newHistory = [chatData, ...chatHistory.filter(chat => chat.id !== chatData.id)].slice(0, 20); // Keep only 20 most recent
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
    setCurrentChatId(chatData.id);
  };

  const handleNewChat = () => {
    // Save current chat before starting new one
    if (messages.length > 0) {
      saveChatToHistory(messages, selectedAgent, selectedModel);
    }
    
    setMessages([]);
    setCurrentChatId(null);
    setOrigin(null);
    setDestination(null);
    setRoutes([]);
    setPlaces([]);
    setTraffic(null);
  };

  const handleChatSelect = (chat) => {
    // Save current chat before switching
    if (messages.length > 0 && currentChatId !== chat.id) {
      saveChatToHistory(messages, selectedAgent, selectedModel);
    }
    
    setMessages(chat.messages);
    setSelectedAgent(chat.agent);
    setSelectedModel(chat.model);
    setCurrentChatId(chat.id);
    
    // Restore map data if it exists
    if (chat.mapData) {
      setOrigin(chat.mapData.origin);
      setDestination(chat.mapData.destination);
      setRoutes(chat.mapData.routes || []);
      setPlaces(chat.mapData.places || []);
      setTraffic(chat.mapData.traffic);
    }
  };

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId);
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
        onClearChat={clearChat}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        onChatSelect={handleChatSelect}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning={true}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className={`w-10 h-10 bg-gradient-to-r ${userAgents[selectedAgent].color} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{userAgents[selectedAgent].name.split(' ')[0]}</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{userAgents[selectedAgent].name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userAgents[selectedAgent].description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Maps Panel - Show as expandable section when Maps agent is selected */}
          {selectedAgent === 'maps' && (
            <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <MapsPanel
                origin={origin}
                destination={destination}
                routes={routes}
                places={places}
                traffic={traffic}
                isLoadingMap={isLoadingMap}
                onOriginChange={setOrigin}
                onDestinationChange={setDestination}
                onFindPlaces={findPlacesAlongRoute}
                onGetDirections={getDirections}
                onGetTraffic={getTrafficInfo}
              />
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <div className={`w-16 h-16 bg-gradient-to-r ${userAgents[selectedAgent].color} rounded-full flex items-center justify-center mb-4`}>
                    <span className="text-white font-bold text-2xl">{userAgents[selectedAgent].name.split(' ')[0]}</span>
                  </div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">{userAgents[selectedAgent].name}</h2>
                  <p className="mb-4 max-w-md">{userAgents[selectedAgent].description}</p>
                  {selectedAgent === 'maps' ? (
                    <p className="text-sm max-w-md">Set your origin and destination in the side panel, then ask me about routes, restaurants, traffic, and more!</p>
                  ) : (
                    <p className="text-sm max-w-md">Ask me anything and I'll help you out!</p>
                  )}
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.isError
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
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
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      selectedAgent === 'maps' 
                        ? "Ask about routes, traffic, restaurants, or any location-based questions..." 
                        : "Type your message... (Press Enter to send, Shift+Enter for new line)"
                    }
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    rows="1"
                    style={{ minHeight: '50px', maxHeight: '150px' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium flex items-center justify-center min-w-[80px]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning={true}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
