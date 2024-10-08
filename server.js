const development = true;

const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const connectDB = require("./db/db");

const http = require('http');
const socketIo = require('socket.io');

const port = process.env.PORT;
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);

// Determine the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set up CORS options based on environment
const corsOptions = isDevelopment
  ? { origin: '*', methods: ["GET", "POST"] } // Allow all origins in development
  : { origin: 'https://terminal-6xn7.onrender.com', methods: ["GET", "POST"] }; // Restrict to your domain in production

// Use CORS middleware for Express
app.use(cors(corsOptions));

// Create Socket.IO server with CORS configuration
const io = socketIo(server, {
  cors: corsOptions // Reuse the same CORS options for Socket.IO
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));


const users = []; // Array to store logged-in users
const rooms = {}; // Store rooms with the users inside them


// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  

  socket.on('userLogin', (username) => {
    users[username] = socket.id;

    if (!users.includes(username)) {
        console.log('waaaa:')
        console.log(users)
        users.push(username); 
    }
  });

  socket.on('userLogout', (username) => {
      const index = users.indexOf(username);
      if (index !== -1) {
          users.splice(index, 1);
      }
  });

  socket.on('requestUserList', (callback) => {
    callback(users);
  });

  // Add event listeners here, e.g.:
  socket.on('chat message', (msg) => {
    //console.log('Message received:', msg); //Only for development
    io.emit('chat message', msg);
  });


   // CREATE GAME LOBBY: 
   // Handle inviting users to the game lobby
   socket.on('invite', (roomId, invitedUsername, callback) => {
    const invitedSocketId = users[invitedUsername];
    if (invitedSocketId) {
        io.to(invitedSocketId).emit('invitation', roomId);
        callback(`Invitation sent to ${invitedUsername}`);
    } else {
        callback(`${invitedUsername} is not online`);
    }
    });

    // Handle joining a game lobby
    socket.on('joingame', (roomId, username, callback) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].push(username); // Add the user to the room
            callback(`Joined game lobby: ${roomId}`);
            io.to(roomId).emit('chat message', `${username} has joined the game lobby!`);
        } else {
            callback(`Room ${roomId} does not exist.`);
        }
    });

    // Handle chat messages within a game lobby
    socket.on('lobbyMessage', (roomId, message) => {
        io.to(roomId).emit('chat message', message); // Broadcast to everyone in the room
    });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
});


app.use("/api", authRoutes);

connectDB();


server.listen(port, () => {
  console.log(`io Listening on port : ${port}`);
});
