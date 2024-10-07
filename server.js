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
const io = socketIo(server);

app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ["GET", "POST"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static('public'));


// app.get('/socket.io/socket.io.js', (req, res) => {
//   console.log('Socket.IO client script requested');
//   res.sendFile(require.resolve('socket.io-client/dist/socket.io.js'));
// });

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Add event listeners here, e.g.:
  socket.on('message', (msg) => {
    console.log('Message received:', msg);
    // Broadcast message to all clients
    io.emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


app.use("/api", authRoutes);

connectDB();

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

