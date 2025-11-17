import React, { useState } from 'react';
import { customerAPI, messageAPI } from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationList({ conversations, onSelect }) {
  const [filter, setFilter] = useState('all');

  const filtered = conversations.filter((c) =>
    filter === 'all' ? true : c.status === filter
  );

  return (
    <div className="w-80 bg-gray-50 border-r h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
      </div>

      {/* Filters */}
      <div className="p-2 border-b flex gap-2">
        {['all', 'open', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className="p-4 border-b hover:bg-gray-100 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">
                  {conversation.customer_name}
                </p>
                <p className="text-sm text-gray-600">{conversation.customer_phone}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  conversation.status === 'open'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {conversation.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(new Date(conversation.updated_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
