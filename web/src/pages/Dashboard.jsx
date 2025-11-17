import React, { useState, useEffect } from 'react';
import { messageAPI } from '../services/api.js';
import ConversationList from '../components/ConversationList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

export default function Dashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    try {
      const response = await messageAPI.getConversation(conversation.id);
      setSelectedConversation(response.data.data);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ConversationList
        conversations={conversations}
        onSelect={handleSelectConversation}
      />
      {selectedConversation ? (
        <div className="flex-1">
          <ChatWindow conversation={selectedConversation} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a conversation to start</p>
        </div>
      )}
    </div>
  );
}
