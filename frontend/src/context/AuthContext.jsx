import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * AuthContext.jsx
 * Global auth state — provides user, token, login(), logout(), updateUser().
 * Token is persisted in localStorage under 'healthPredict_token'.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('healthPredict_token') || sessionStorage.getItem('healthPredict_token'));
    const [loading, setLoading] = useState(true);

    // Re-hydrate user from localStorage/sessionStorage on cold start
    useEffect(() => {
        const stored = localStorage.getItem('healthPredict_user') || sessionStorage.getItem('healthPredict_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData, jwtToken, rememberMe = true) => {
        setUser(userData);
        setToken(jwtToken);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('healthPredict_token', jwtToken);
        storage.setItem('healthPredict_user', JSON.stringify(userData));
        
        // Clear the other storage just in case
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem('healthPredict_token');
        otherStorage.removeItem('healthPredict_user');
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('healthPredict_token');
        localStorage.removeItem('healthPredict_user');
        sessionStorage.removeItem('healthPredict_token');
        sessionStorage.removeItem('healthPredict_user');
    }, []);

    const updateUser = useCallback((updated) => {
        setUser(updated);
        if (localStorage.getItem('healthPredict_token')) {
            localStorage.setItem('healthPredict_user', JSON.stringify(updated));
        } else if (sessionStorage.getItem('healthPredict_token')) {
            sessionStorage.setItem('healthPredict_user', JSON.stringify(updated));
        }
    }, []);

    const isAdmin = user?.role === 'admin';
    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
