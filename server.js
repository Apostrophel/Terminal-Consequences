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
const io = socketIo(server, {
  cors: {
    //origin: '*', // Allow all origins for development
    origin: 'https://terminal-6xn7.onrender.com', // Allow only your deployed domain
    methods: ["GET", "POST"]
  }
});



app.use(cors({
  //origin: '*', // Allow all origins for development
  origin: 'https://terminal-6xn7.onrender.com', // Allow only your deployed domain
  methods: ["GET", "POST"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Add event listeners here, e.g.:
  socket.on('chat message', (msg) => {
    //console.log('Message received:', msg); //Only for development
    // Broadcast message to all clients
    io.emit('chat message', msg);
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

// app.listen(port, () => {
//   console.log(`Server running on port: ${port}`);
// });

