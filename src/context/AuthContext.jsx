import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('stockflow.user');
    return raw ? JSON.parse(raw) : null;
  });
  const [organization, setOrganization] = useState(() => {
    const raw = localStorage.getItem('stockflow.organization');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const token = localStorage.getItem('stockflow.token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        if (cancelled) return;
        setUser(data.user);
        setOrganization(data.organization);
        localStorage.setItem('stockflow.user', JSON.stringify(data.user));
        localStorage.setItem('stockflow.organization', JSON.stringify(data.organization));
      } catch {
        // interceptor will redirect on 401
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  function persistSession({ token, user, organization }) {
    localStorage.setItem('stockflow.token', token);
    localStorage.setItem('stockflow.user', JSON.stringify(user));
    localStorage.setItem('stockflow.organization', JSON.stringify(organization));
    setUser(user);
    setOrganization(organization);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
    return data;
  }

  async function signup(email, password, organizationName) {
    const { data } = await api.post('/auth/signup', {
      email,
      password,
      organizationName,
    });
    persistSession(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('stockflow.token');
    localStorage.removeItem('stockflow.user');
    localStorage.removeItem('stockflow.organization');
    setUser(null);
    setOrganization(null);
  }

  function updateOrganization(next) {
    setOrganization(next);
    localStorage.setItem('stockflow.organization', JSON.stringify(next));
  }

  const value = useMemo(
    () => ({ user, organization, loading, login, signup, logout, updateOrganization }),
    [user, organization, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
