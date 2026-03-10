import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to Racing Gateway');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
