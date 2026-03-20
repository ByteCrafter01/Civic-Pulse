import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../api/socket';
import toast from 'react-hot-toast';

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
            // Show toast notification
            if (data.message) {
                toast(data.message, {
                    icon: '\u2139\uFE0F',
                    duration: 4000,
                    style: { borderRadius: '8px', background: '#1e293b', color: '#fff', fontSize: '14px' },
                });
            }
        });

        socket.on('sla:warning', (data) => {
            setNotifications((prev) => [
                { id: Date.now(), type: 'sla', message: 'SLA deadline approaching', ...data },
                ...prev.slice(0, 19),
            ]);
            toast.error('SLA deadline approaching for a complaint', { duration: 5000 });
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('complaint:status_changed');
            socket.off('sla:warning');
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
