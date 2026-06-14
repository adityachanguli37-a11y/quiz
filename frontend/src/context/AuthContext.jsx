import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Check if session exists on boot
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/session');
        setAdmin(response.data);
      } catch (error) {
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Configure Web Sockets when Admin logs in
  useEffect(() => {
    if (!admin) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected to server');
      newSocket.emit('join_admin_room');
    });

    newSocket.on('new_notification', (notif) => {
      console.log('WebSocket notification received:', notif);
      setNotifications((prev) => [notif, ...prev]);
      
      // Trigger simple in-app visual alert
      showToastNotification(notif.title, notif.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [admin]);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { accessToken, refreshToken, ...adminData } = response.data;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    setAdmin(adminData);
    return adminData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAdmin(null);
      setNotifications([]);
    }
  };

  // Toast alert dispatcher
  const showToastNotification = (title, message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-slate-900 border-l-4 border-emerald-500 text-white p-4 rounded shadow-2xl z-50 animate-bounce transition-all duration-300 max-w-sm';
    toast.innerHTML = `
      <div class="font-bold text-emerald-400">${title}</div>
      <div class="text-sm mt-1 text-slate-300">${message}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, socket, notifications, setNotifications }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
