
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  isAuthenticated: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data: AuthResponse = await response.json();
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('admin_user');
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        return null;
      }
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch {
      return null;
    }
  };

  const isAuthenticated = async (): Promise<boolean> => {
    try {
      const userData = await getCurrentUser();
      return !!userData;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = sessionStorage.getItem('admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('admin_user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      getCurrentUser,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const SessionUtils = {
  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const userData = sessionStorage.getItem("admin_user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: User): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("admin_user", JSON.stringify(user));
  },

  clearStoredUser(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("admin_user");
  },

  isLoggedIn(): boolean {
    return !!this.getStoredUser();
  },
};
