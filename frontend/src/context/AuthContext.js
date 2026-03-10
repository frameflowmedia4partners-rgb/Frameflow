import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "frameflow_token";
const USER_KEY = "frameflow_user";
const IMPERSONATION_KEY = "frameflow_impersonation";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [impersonation, setImpersonation] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedImpersonation = localStorage.getItem(IMPERSONATION_KEY);

        if (storedToken) {
          const API = process.env.REACT_APP_BACKEND_URL;
          const response = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setToken(storedToken);
            setUser(userData);
            setIsAuthenticated(true);
            
            if (storedImpersonation) {
              try {
                setImpersonation(JSON.parse(storedImpersonation));
              } catch (e) {
                localStorage.removeItem(IMPERSONATION_KEY);
              }
            }
          } else {
            clearAuthData();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setImpersonation(null);
  };

  const login = useCallback((authToken, userData) => {
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
  }, []);

  const updateUser = useCallback((userData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(prev => ({ ...prev, ...userData }));
  }, []);

  const startImpersonation = useCallback((clientInfo, impersonationToken) => {
    localStorage.setItem(TOKEN_KEY, impersonationToken);
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(clientInfo));
    setToken(impersonationToken);
    setImpersonation(clientInfo);
  }, []);

  const exitImpersonation = useCallback(() => {
    clearAuthData();
    window.location.href = "/auth";
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    impersonation,
    isAdmin: user?.role === "super_admin",
    isClient: user?.role === "client_user" || (!user?.role && isAuthenticated),
    login,
    logout,
    updateUser,
    startImpersonation,
    exitImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
