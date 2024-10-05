const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    let username;

    socket.on('login', (user) => {
        username = user;
        console.log(`${username} has joined the chat`);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', { username: username, message: msg });
    });

    socket.on('disconnect', () => {
        console.log(`${username} has left the chat`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
