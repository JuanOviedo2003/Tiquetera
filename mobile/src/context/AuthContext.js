import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'tiquetera_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        // Ignorar sesión corrupta
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const persistUser = async (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      const authUser = data.usuario || data.user || data;
      const role = authUser.role || authUser.rol || 'RESTAURANTE';
      if (role !== 'SUPER_ADMIN' && !authUser.restaurante_id) {
        authUser.restaurante_id = 'REST-1';
      }
      await persistUser(authUser);
      return authUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await persistUser(null);
  };

  const isSuperAdmin = (user?.role || user?.rol) === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        isAuthenticated: Boolean(user),
        isSuperAdmin,
        loading,
        login,
        logout,
        restauranteId: user?.restaurante_id || 'REST-1',
        restauranteNombre: user?.restaurante_nombre || '',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
