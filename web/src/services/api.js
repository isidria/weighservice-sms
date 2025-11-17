import axios from 'axios';
import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

let socket = null;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const initSocket = () => {
  if (!socket) {
    socket = io(WS_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });
  }
  return socket;
};

export const getSocket = () => socket;

// Message API
export const messageAPI = {
  send: (conversationId, body, mediaUrls) =>
    apiClient.post('/messages/send', { conversationId, body, mediaUrls }),
  getConversations: () => apiClient.get('/messages/conversations'),
  getConversation: (id) => apiClient.get(`/messages/conversations/${id}`),
  updateConversation: (id, status) =>
    apiClient.put(`/messages/conversations/${id}`, { status }),
};

// Customer API
export const customerAPI = {
  create: (data) => apiClient.post('/customers', data),
  list: () => apiClient.get('/customers'),
  get: (id) => apiClient.get(`/customers/${id}`),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
  delete: (id) => apiClient.delete(`/customers/${id}`),
};
