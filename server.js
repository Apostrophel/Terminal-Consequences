
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

// import express from 'express';
// import dotenv from 'dotenv';
// dotenv.config();
// import cors from 'cors';
// import connectDB from './db/db.js'; // Ensure to use .js extension for ESM
// import http from 'http';
// //import { Server as socketIo } from 'socket.io'; // Updated import for socket.io
// import { Server } from 'socket.io'; // Import Server from socket.io
// import authRoutes from './routes/authRoutes.js'; // Ensure to use .js extension for ESM



// Determine the environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set up CORS options based on environment
const corsOptions = isDevelopment
  ? { origin: '*', methods: ["GET", "POST"] } // Allow all origins in development
  : { origin: 'https://terminal-6xn7.onrender.com', methods: ["GET", "POST"] }; // Restrict to your domain in production

// Use CORS middleware for Express
app.use(cors(corsOptions));

// Create Socket.IO server with CORS configuration
//const io = new Server(server, { // Use new Server to create the Socket.IO instance
const io = socketIo(server, {
  cors: corsOptions // Reuse the same CORS options for Socket.IO
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));


const users = {}; // Array to store logged-in users
const rooms = {}; // Store rooms with the users inside them
 

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('userLogin', (username) => {
    users[username] = socket.id;
    //console.log("login: ", username, ". Users: ", users)

  });

  socket.on('userLogout', user_name => {
    if (users[user_name]) {
        delete users[user_name]; // This removes both the username and the associated socket ID
    }
    //console.log("Useres aft: ", users)
  });

  socket.on('requestUserList', (callback) => {
    callback(users);
  });

  // Add event listeners here, e.g.:
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('whisper message', (user, msg) =>{
    console.log('whisper received:', user, msg); //Only for development

    io.emit('whisper message', user, msg);

  });

   // CREATE GAME LOBBY: 
   // Handle inviting users to the game lobby

  socket.on('creategame', (username, callback) => {
    //newRoomId = uuidv4(); // Generate a unique room ID
    const newRoomId = nanoid(4); // Generates a unique ID like "V1StG4h"
    //const newRoomId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8); // 8 is the length of the ID

    rooms[newRoomId] = {
        settings: {
          host: username,
          gameName: `${username}'s Game`, // Default game name
          maxPlayers: 4, // Example of a default setting
          isStarted: false // Game state
        },
        users: {}, // Store users and their roles
    };

    socket.join(newRoomId); // Join the room with the unique ID
    console.log(`${username} created and joined room: ${newRoomId}`);

    callback(`/game/${newRoomId}`);

  });

  socket.on('invite', (roomId, invitedUsername, hostUser, callback) => {
  const invitedSocketId = users[invitedUsername];
  if (invitedSocketId) {
      io.to(invitedSocketId).emit('invitation', invitedUsername, hostUser,  roomId);
      callback(`Invitation sent to ${invitedUsername}`);
  } else {
      callback(`${invitedUsername} is not online`);
  }
  });

  // Handle joining a game lobby
  socket.on('joinGame', (roomId, username, callback) => {
      //console.log("User joined game", roomId, " ", username);
      if (rooms[roomId]) {
          socket.join(roomId);
          //rooms[roomId].push(username); // Add the user to the room

          if (Object.keys(rooms[roomId].users).length === 0){
            rooms[roomId].users[username] = { role: 'host' }; // or any role or data associated with the user
          } else { 
            rooms[roomId].users[username] = { role: 'guest' }; // or any role or data associated with the user
          }
          callback(`Joined game lobby: ${roomId}`);
          io.to(roomId).emit('gameMessage', `<green>Game Lobby: </green>${username} has joined the game lobby!`);   //TODO: Where is this emitted to?
      } else {
          callback(`Room ${roomId} does not exist.`);
      }
  });

  // Handle chat messages within a game lobby
  socket.on('gameMessage', (roomId, message) => {
      //console.log(`Server recieved game message: ${roomId}, ${message}`)
      io.to(roomId).emit('gameMessage', message); // Broadcast to everyone in the room
  });

  socket.on('get room users', (room_id, callback) => {
      callback(rooms[room_id].users);
  });

  socket.on('userLeft', (user, room_id) => {

    //rooms[room_id] = rooms[room_id].filter(currentUser => currentUser !== user);
    delete rooms[room_id].users[user];

    broadcast_message = `<green>Game Lobby:</green> ${user} has left the game lobby.`
    io.to(room_id).emit('gameMessage', broadcast_message); // Broadcast to everyone in the room

  });

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      
  });
});


app.use("/api", authRoutes);

connectDB();


// Serve game page for a specific game lobby
app.get('/game/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  // You would typically serve an HTML page here for the game, or use res.render() if using a template engine
  res.sendFile(__dirname + '/public/game.html'); // Serve game.html for the game lobby
});


server.listen(port, () => {
  console.log(`io Listening on port : ${port}`);
});
