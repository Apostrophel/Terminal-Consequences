const { io } = require('socket.io-client'); // Import the Socket.IO client
const fetch = require('node-fetch'); // If you are using fetch for HTTP requests

const socketUrl = 'http://localhost:5000'; // Use the HTTP URL for the Socket.IO connection
const loginUrl = 'http://localhost:5000/api/login'; // Your login API URL

// User credentials (make sure these users exist in your system)
const users = [
    { username: 'User1', password: 'password1' },
    { username: 'User2', password: 'password2' },
    { username: 'User3', password: 'password3' },
]; // Add more users as needed

// Function to log in a user and return the token
const loginUser = async (user) => {
    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username, password: user.password }),
    });

    const result = await response.json();
    if (response.ok) {
        console.log(`${user.username} logged in successfully.`);
        return result.token; // Assuming your login API returns a token
    } else {
        console.error(`${user.username} failed to log in: ${result.error}`);
        return null;
    }
};

// Function to simulate user message sending after login
const simulateUserMessages = (username, token) => {
    const socket = io(socketUrl); // Connect to the Socket.IO server

    socket.on('connect', () => {
        console.log(`${username} connected to chat.`);
        
        // Emit user login event
        socket.emit('userLogin', username);

        // Send a welcome message after connecting
        socket.emit('chat message', { username, message: `${username} has joined the chat!` });

        // Simulate sending messages every 2 seconds
        setInterval(() => {
            socket.emit('chat message', { username, message: `${username}: Hello from the lobby!` });
        }, 2000);
    });

    socket.on('message', (data) => {
        console.log(`Message received: ${data}`);
    });

    socket.on('error', (error) => {
        console.error(`Socket error for ${username}: ${error}`);
    });

    socket.on('disconnect', () => {
        console.log(`${username} disconnected`);
    });
};

// Start simulating users
const runTests = async () => {
    for (const user of users) {
        const token = await loginUser(user);
        if (token) {
            simulateUserMessages(user.username, token);
        }
    }
};

// Run the test script
runTests();
