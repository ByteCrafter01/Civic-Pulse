import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
    if (!socket) {
        socket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
        });
    }
    return socket;
};

export const connectSocket = (userId, role) => {
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit('join', { userId, role });
    return s;
};

export const disconnectSocket = () => {
    if (socket?.connected) socket.disconnect();
};
