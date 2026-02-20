import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { connectSocket, disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(({ data }) => {
                    setUser(data.data);
                    connectSocket(data.data.id, data.data.role);
                })
                .catch(() => localStorage.clear())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const { data } = await api.post('/auth/login', credentials);
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        connectSocket(user.id, user.role);
        return user;
    };

    const register = async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        const { user, accessToken, refreshToken } = data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        connectSocket(user.id, user.role);
        return user;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        disconnectSocket();
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
