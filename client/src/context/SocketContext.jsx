import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../api/socket';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const socket = getSocket();

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('complaint:status_changed', (data) => {
            setNotifications((prev) => [
                { id: Date.now(), type: 'status', ...data },
                ...prev.slice(0, 19), // keep last 20
            ]);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('complaint:status_changed');
        };
    }, []);

    const clearNotification = (id) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id));

    return (
        <SocketContext.Provider value={{ connected, notifications, clearNotification }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
