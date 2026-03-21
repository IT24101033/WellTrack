import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * AuthContext.jsx
 * Global auth state — provides user, token, login(), logout(), updateUser().
 * Token is persisted in localStorage under 'healthPredict_token'.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('healthPredict_token'));
    const [loading, setLoading] = useState(true);

    // Re-hydrate user from localStorage on cold start
    useEffect(() => {
        const stored = localStorage.getItem('healthPredict_user');
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('healthPredict_token', jwtToken);
        localStorage.setItem('healthPredict_user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('healthPredict_token');
        localStorage.removeItem('healthPredict_user');
    }, []);

    const updateUser = useCallback((updated) => {
        setUser(updated);
        localStorage.setItem('healthPredict_user', JSON.stringify(updated));
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
