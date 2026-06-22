class SocketService {
  constructor(io) {
    this.io = io;
  }

  emitToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  emitToUser(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  broadcastOnlineCount() {
    this.io.emit('online-count', this.io.engine.clientsCount);
  }
}

module.exports = SocketService;
