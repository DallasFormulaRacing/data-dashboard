'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2, Send } from 'lucide-react';

type ChatSize = 'minimized' | 'normal' | 'fullscreen';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const [size, setSize] = useState<ChatSize>('minimized');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // No automatic bot response - removed the demo response
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Minimized - Small circle button
  if (size === 'minimized') {
    return (
      <button
        onClick={() => setSize('normal')}
        className="fixed z-[9998] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer group"
        style={{ bottom: '-2px', left: '8px', backgroundColor: 'rgb(232, 117, 0)' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(232, 117, 0)'}
        aria-label="Open chat"
      >
        <MessageCircle size={24} className="text-white" />
      </button>
    );
  }

  // Normal - Medium chat window
  if (size === 'normal') {
    return (
      <div 
        className="fixed z-[9998] w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border-2"
        style={{ bottom: '-2px', left: '8px', borderColor: 'rgb(18, 71, 52)' }}
      >
        {/* Header */}
        <div className="text-white p-4 rounded-t-2xl flex items-center justify-between" style={{ backgroundColor: 'rgb(232, 117, 0)' }}>
          <div className="flex items-center gap-3">
            <MessageCircle size={24} />
            <div>
              <h3 className="font-bold text-lg">Chat Assistant</h3>
              <p className="text-xs text-white opacity-90">Online now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSize('fullscreen')}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(18, 71, 52, 0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(18, 71, 52, 0.3)'}
              aria-label="Maximize"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={() => setSize('minimized')}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(18, 71, 52, 0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(18, 71, 52, 0.3)'}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'text-white'
                    : 'bg-white text-gray-800 border-2'
                }`}
                style={message.sender === 'user' 
                  ? { backgroundColor: 'rgb(232, 117, 0)' } 
                  : { borderColor: 'rgb(18, 71, 52)' }}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border-2 rounded-full focus:outline-none focus:ring-2 text-gray-800"
              style={{ borderColor: 'rgb(18, 71, 52)' }}
              onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(18, 71, 52, 0.2)'}
              onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
            />
            <button
              onClick={handleSendMessage}
              className="text-white p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center w-10 h-10"
              style={{ backgroundColor: 'rgb(232, 117, 0)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(232, 117, 0)'}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen - Almost full page
  return (
    <div className="fixed inset-4 z-[9998] bg-white rounded-2xl shadow-2xl flex flex-col border-2" style={{ borderColor: 'rgb(18, 71, 52)' }}>
      {/* Header */}
      <div className="text-white p-6 rounded-t-2xl flex items-center justify-between" style={{ backgroundColor: 'rgb(232, 117, 0)' }}>
        <div className="flex items-center gap-3">
          <MessageCircle size={28} />
          <div>
            <h3 className="font-bold text-2xl">Chat Assistant</h3>
            <p className="text-sm text-white opacity-90">Online now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSize('normal')}
            className="p-3 rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 71, 52, 0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(18, 71, 52, 0.3)'}
            aria-label="Minimize"
          >
            <Minimize2 size={20} />
          </button>
          <button
            onClick={() => setSize('minimized')}
            className="p-3 rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 71, 52, 0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(18, 71, 52, 0.3)'}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[60%] rounded-2xl px-6 py-3 ${
                message.sender === 'user'
                  ? 'text-white'
                  : 'bg-white text-gray-800 border-2'
              }`}
              style={message.sender === 'user' 
                ? { backgroundColor: 'rgb(232, 117, 0)' } 
                : { borderColor: 'rgb(18, 71, 52)' }}
            >
              <p className="text-base">{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-6 py-3 border-2 rounded-full focus:outline-none text-gray-800 text-base"
            style={{ borderColor: 'rgb(18, 71, 52)' }}
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(18, 71, 52, 0.2)'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
          />
          <button
            onClick={handleSendMessage}
            className="text-white px-6 py-3 rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2 font-semibold"
            style={{ backgroundColor: 'rgb(232, 117, 0)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 71, 52)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(232, 117, 0)'}
            aria-label="Send message"
          >
            <Send size={20} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};