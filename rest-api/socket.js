let io;

module.exports = {
    init: httpServer => {
        io = require('socket.io')(httpServer);
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized.');
        }
        // socket.nio initialized
        return io;
    }
};
