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
const { initializeChatLogs, insertChatLog, retrieveChatLogs } = require('./controllers/chatDbControllers');
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
const mainLobbyId = 'mainLobby';


// Initialise the chat log database when the server starts
initializeChatLogs().then(() => { 
  console.log("Chat logs table initialized.");
}).catch((error) => {
  console.error("Failed to initialize chat logs table:", error);
});
 
// Socket.IO connection
io.on('connection', (socket) => {
  socket.emit('connectionStatus', 'connecting');

  let username; // Declare username for this connection
  socket.on('userLogin', async (user) => {
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

  socket.on('requestChatLog', async (roomId) => {
    try {
      const chatLogs = await retrieveChatLogs(roomId); // Retrieve chat logs from the database
      socket.emit('loadChatHistory', chatLogs); // Emit the chat logs to the client
    } catch (error) {
      console.error("Error retrieving chat logs:", error);
    }
  });

  socket.on('chatMessage',  async (user_id, room_id, msg) => {
    const messageId = uuidv4(); // or use any other unique ID generator

    try {
      await insertChatLog(messageId, room_id, user_id, msg); // Pass parameters in the correct order
    } catch (error) {
      console.error("Error saving chat log:", error);
    }

    let timestamp = new Date().toLocaleTimeString();
    const chatMessage = `${timestamp}  ${user_id}:\t\t${msg}`;
    io.emit('chatMessage', chatMessage);
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
          isStarted: false, // Game state
          guestInvite: false  //Set if guests also can invite other users
        },
        invited_users: [],    //store list of invited users (usernames)
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
        io.to(invitedSocketId).emit('invitation', hostUser,  roomId);
        rooms[roomId].invited_users.push(invitedUsername);
        callback(`Invitation sent to ${invitedUsername}`);
    } else {
        callback(`${invitedUsername} is not online`);
    }
  });

  // Handle joining a game lobby
  socket.on('joinGame', (roomId, username, callback) => {
       if (rooms[roomId]) {
          socket.join(roomId);

          const userAlreadyJoined = rooms[roomId].users[username];

          rooms[roomId].users[username] = socket.id;

          callback(`Joined game lobby: ${roomId}`);
          rooms[roomId].invited_users = rooms[roomId].invited_users.filter(user => user !== username);                  //Withdraw the invite after user joined
          if(!userAlreadyJoined){
            io.to(roomId).emit('gameMessage', `<green>Game Lobby: </green>${username} has joined the game lobby!`);   //TODO: issue #31
          }
      } else {
          callback(`Room ${roomId} does not exist.`);
      }
  });

  // Handle requesting joining a game lobby:
  socket.on('requestJoin', (username, roomId, callback) => {
    console.log(`this happened: ${username}, ${roomId}`)
    if (rooms[roomId]) {
        if (rooms[roomId].invited_users.includes(username)){
          callback({ room_exists: true, invitation: true, message: `<yellow>Joining room: ${roomId}.</yellow>` })
        } else {

          host_username = rooms[roomId].settings.host;
          host_socketID = users[host_username];

          const host_socket = io.sockets.sockets.get(host_socketID);
          console.log(`Host socket: ${host_socketID}, host user: ${host_username}, Socket exists: ${!!host_socket}`);

          if (host_socket) {
              // Notify the room and the host specifically about the join request
              io.to(roomId).emit('gameMessage', `<green>Game Lobby: </green>${username} has requested to join the game lobby!`);
              
              io.to(host_socketID).emit('gameMessage', 
                `<green>Game Lobby: </green>[[!;;;;#]Let ${username} join].`);
          } else {
              console.log('Host is not connected');
          }

          callback({ room_exists: true, invitation: false,  message: `<green>TQ: </green><yellow>An invitation request has been sent to the host of game: ${roomId}.</yellow>` })
        }
    } else {
      callback({ room_exists: false,  invitation: false,  message: `The room: ${roomId} does not exist.` })

    }
  });

  // Handle the host clicking the "Let user join" command
  socket.on('letUserJoin', (roomId, username, hostUser) => {
    const invitedSocketId = users[username];
    if (invitedSocketId) {
      io.to(invitedSocketId).emit('invitation', hostUser, roomId);
      rooms[roomId].invited_users.push(username);
    }
  });

  socket.on('gameMessage', async (user_id, room_id, msg) => {
      console.log("Received message:", { user_id, room_id, msg }); // Log the received parameters
      const messageId = uuidv4(); // or use any other unique ID generator
      
      try {
        await insertChatLog(messageId, room_id, user_id, msg); // Pass parameters in the correct order
      } catch (error) {
        console.error("Error saving game chat log:", error);
      }

      let timestamp = new Date().toLocaleTimeString();
      const chatMessage = `${timestamp}  ${user_id}:\t\t${msg}`;

      io.to(room_id).emit('gameMessage', chatMessage);
  });

  socket.on('getRoomUsers', (room_id, callback) => {
      callback(rooms[room_id].users);
  });

  socket.on('getUserData', (user_id, room_id, callback) => {
      callback(rooms[room_id].users[user_id])
  });

  socket.on('getRoomData', (room_id, callback) => {
    callback(rooms[room_id])
  });

  socket.on('getRoomList', (callback) => {
    callback(rooms);
  });

  socket.on('changeRoomName', (room_id, new_room_name, callback) =>{
    if(rooms[room_id]){
      rooms[room_id].settings.gameName = new_room_name;
      callback(`Name changed to ${new_room_name}`)
    } 
  });

  socket.on('userLeft', (user, room_id) => {
    delete rooms[room_id].users[user];
    broadcast_message = `<green>Game Lobby:</green> ${user} has left the game lobby.`
    io.to(room_id).emit('gameMessage', broadcast_message); 

  });

  socket.on('closeLobby', (roomId, callback) => {
    lobbyName = rooms[roomId].settings.gameName;
    users_in_lobby = rooms[roomId].users 
    Object.values(users_in_lobby).forEach((user) => {
      console.log(user);  // Access each user object
      io.to(user).emit('redirect', { url: '/lobby.html' });
    });
    
    delete rooms[roomId];
    callback(`Game Lobby ${roomId} - ${lobbyName} is shut down.`)
  })

  socket.on('disconnect', () => {
      console.log('Client disconnected');
      
  });
});



app.use("/api", authRoutes);
connectDB();


// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// app.get('/index.html', (req, res) => {
//   res.redirect('/'); // Redirect to the root URL
// });

// // Serve the lobby page at a different route
// app.get('/lobby', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
// });

// app.get('/lobby.html', (req, res) => {
//   res.redirect('/lobby');
// });

// 404 error handling
app.use((req, res, next) => {
  res.status(404).redirect('/'); // Redirect to the home page
});

server.listen(port, () => {
  if(isDevelopment){
    console.log(`Open at: http://localhost:${port}`)
  }else{
    console.log('Deployed at: https://terminal-6xn7.onrender.com.')                                  //TODO: why is this happening on localhost?
  }
  console.log(`Open at: http://localhost:${port}`)                  //TODO: remove line when above TODO is fixed

  console.log(`io Listening on port : ${port}`);
});
