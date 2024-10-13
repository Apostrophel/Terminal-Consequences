/**
 * This script serves as the backend server for the "Terminal Consequences" application, 
 * managing routes, authentication, and real-time communication via Socket.IO. It handles 
 * API requests for user login, registration, and session management. The server also 
 * manages different game rooms and player interactions.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 */

const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const connectDB = require("./db/db");
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require("./routes/authRoutes");
const port = process.env.PORT;
const app = express();
const server = http.createServer(app);
const { v4: uuidv4 } = require('uuid');
//import { nanoid } from 'nanoid';
const {nanoid} = require('nanoid');
const { user } = require("./db/config");
//const { customAlphabet } = require('nanoid');

// Determine the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set up CORS options based on environment
const corsOptions = isDevelopment
  ? { origin: '*', methods: ["GET", "POST"] } // Allow all origins in development
  : { origin: 'https://terminal-6xn7.onrender.com', methods: ["GET", "POST"] }; // Restrict to your domain in production //TODO: change for final deployment

// Use CORS middleware for Express
app.use(cors(corsOptions));

// Create Socket.IO server with CORS configuration
const io = socketIo(server, {
  cors: corsOptions 
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

const users = {}; // Array to store logged-in users
const rooms = {}; // Store active rooms with user data
 
// Socket.IO connection
io.on('connection', (socket) => {
  socket.emit('connectionStatus', 'connecting');  //TODO: This does not happen soon enough. The message comes too late. Issue #23

  let username; // Declare username for this connection
  socket.on('userLogin', (user) => {
    username = user; // Assign the username when the user logs in
    console.log("New client connected: ", username, ". Users: ", users)
    users[username] = socket.id;  
    socket.emit('connectionStatus', 'connected');
  });

  socket.on('userLogout', user_name => {
    if (users[user_name]) {
        delete users[user_name];
    }
  });

  socket.on('requestUserList', (callback) => {
    callback(users);
  });

  // Add event listeners here, e.g.:
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('whisper message', (user, msg) =>{
    io.emit('whisper message', user, msg);
  });

   
  // Handle creating a game lobby
  socket.on('creategame', (username, callback) => {
    //newRoomId = uuidv4();       // Generate a unique room ID            //TODO: experiment and fix this so that id can be all caps alphanumeric. Issue #24
    const newRoomId = nanoid(4);  // Generates a unique ID like "-St4h"
    //const newRoomId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 4); // 4 is the length of the ID

    rooms[newRoomId] = {
        settings: {
          host: username,
          gameName: `${username}'s Game`, // Default game name
          maxPlayers: 4, // Example of a default setting
          isStarted: false // Game state
        },
        users: {}, // Store users and their roles
    };

    socket.join(newRoomId);   // Join the room with the unique ID
    console.log(`${username} created and joined room: ${newRoomId}`);
    callback(`/game/${newRoomId}`);       //TODO: Change to just newRoomId here and for client
  });

  // Handle inviting a user from a game lobby
  socket.on('invite', (roomId, invitedUsername, hostUser, callback) => {
    const invitedSocketId = users[invitedUsername];
    if (invitedSocketId) {
        io.to(invitedSocketId).emit('invitation', invitedUsername, hostUser,  roomId);
        callback(`Invitation sent to ${invitedUsername}`);
    } else {
        callback(`${invitedUsername} is not online`);
    }
  });

  // Handle joining a game lobby, also assigns the lobby-roles (host or guest).
  socket.on('joinGame', (roomId, username, callback) => {
       if (rooms[roomId]) {
          socket.join(roomId);
          if (Object.keys(rooms[roomId].users).length === 0){
            rooms[roomId].users[username] = { role: 'host' };   
          } else { 
            rooms[roomId].users[username] = { role: 'guest' };
          }
          callback(`Joined game lobby: ${roomId}`);
          io.to(roomId).emit('gameMessage', `<green>Game Lobby: </green>${username} has joined the game lobby!`); 
      } else {
          callback(`Room ${roomId} does not exist.`);
      }
  });

  socket.on('gameMessage', (roomId, message) => {
      io.to(roomId).emit('gameMessage', message);
  });

  socket.on('get room users', (room_id, callback) => {
      callback(rooms[room_id].users);
  });

  socket.on('getUserData', (user_id, room_id, callback) => {
      callback(rooms[room_id].users[user_id])
  });

  socket.on('userLeft', (user, room_id) => {
    delete rooms[room_id].users[user];
    broadcast_message = `<green>Game Lobby:</green> ${user} has left the game lobby.`
    io.to(room_id).emit('gameMessage', broadcast_message); 

  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      
  });
});

app.use("/api", authRoutes);
connectDB();

server.listen(port, () => {
  if(isDevelopment){
    console.log(`Open at: http://localhost:${port}`)
  }else{
    console.log('Deployed at: https://terminal-6xn7.onrender.com.')                                  //TODO: why is this happening on localhost?
  }
  console.log(`Open at: http://localhost:${port}`)                  //TODO: remove line when above TODO is fixed

  console.log(`io Listening on port : ${port}`);
});
