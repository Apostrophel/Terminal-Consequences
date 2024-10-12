// Determine if we are in development or production based on the window location
const isDevelopment = window.location.hostname === 'localhost'; 

// Use the appropriate Socket.IO server URL based on the environment
const socket = io(isDevelopment ? 'http://localhost:5000' : 'https://terminal-6xn7.onrender.com', {
    transports: ['websocket', 'polling'] // Use both websocket and polling transports
});

socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server');
    
    const username = localStorage.getItem('username');
    socket.emit('userLogin', username);


});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
    console.log(err.message);

    // some additional description, for example the status code of the initial HTTP response
    console.log(err.description);
  
    // some additional context, for example the XMLHttpRequest object
    console.log(err.context);
});

const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });
  
  
let chatMode = false;
let timestamp = new Date().toLocaleTimeString(); // 11:18:48 AM
const quit_chat_commands = ['!exit', '!chatmode' ]


const commands = {
    help(command_name) {
        switch(command_name) {
            case 'list':
                term.echo('e.g. list users, will list users currently in chat.');
              break;
            case 'say':
                term.echo(`To post a message in chat write >say "your message" `);
              break;

            default:
                if (command_name != null) {
                    term.echo(`No spesific information on ${command_name} \nList of available commands: ${help}.`);
                } else {
                    term.echo(`List of available commands: ${help}. Type help *command* for info on spesific command.`);
                }   
          } 
    },
    echo(...args) {
        if (args.length > 0) {
            term.echo(args.join(' '));
        }
    },

    chatmode(){
        if(chatMode){
            chatMode = false;
            term.echo('Exited chat mode. You can now enter commands.');
        } else {
            chatMode = true;
            term.echo(`You are now in chat mode. Type your message and hit Enter to send. Back to terminal use: <yellow>${quit_chat_commands}</yellow>`);
            //$.terminal.new_formatter([re, function(_, command, args) {
                term.set_prompt('<yellow>chat</yellow>> ');
            //    return ' '
            //}]); 
        }
    },

    refresh(){
        term.exec('clear');
        ready();
    },

    logout() {
        const username = localStorage.getItem('username');
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        term.echo('You have been logged out successfully, bye!');

        socket.emit('userLogout', username);                        //TODO: Do this also for disconnect etc ????

        setTimeout(() => {
            window.location.href = 'index.html'; // Replace with your login page URL
        }, 500); // 1 second delay for user feedback before redirecting
    },

    exit: function() {  // Define exit as a function reference
        term.exec('logout'); // Call logout when exit is invoked
    },

    say(message) {
        const username = localStorage.getItem('username');
        if (username && message) {
            const chatMessage = `${timestamp}  ${username}:\t\t${message}`;
            socket.emit('chat message', chatMessage);
        } else if (message == null) {
            term.echo('Please provide message.');
        } else {
            term.echo('Please log in to chat.');
        }
    },

    list(variable) {

        if (variable === "users") {
            
            socket.emit('requestUserList', (users) => {
 
                if (Object.keys(users).length > 0) { // Use Object.keys() for an object or .length for an array
                    const userList = Object.keys(users).join(', ');  // Join the keys of the object (usernames)
                    term.echo(`Currently logged in users: ${userList}`);
                } else {
                    term.echo('No users are currently logged in.');
                }
            });

        } else {
            term.echo('list what?');
        }

    },

    who() {
            term.exec('list users');  //TODO: EXCEC DOES NOT WOEKK
    },

    whisper(to_username, message){
        const username = localStorage.getItem('username');
        const whisperMessage = `${timestamp}  ${username} whispers: \t\t<pink>${message}</pink>`;
        socket.emit('whisper message', to_username, whisperMessage);               //sends the message to all connected clients.

    },

    // Command to create a game
    creategame() {
        socket.emit('creategame', username, (response) => {
            
            //console.log(`Game created at: ${response}`)
            term.echo(`Game created at: ${response}`); // Show the room ID or any feedback
            // Redirect to game.html with the new room ID as a query parameter
            window.location.href = `game.html?roomId=${response.split('/').pop()}`; // Extract the room ID from the response

        });

    },

    // join(room_id){
    //     socket.emit('joinGame', username, room_id (response) => {
    //     window.location.href = `game.html?roomId=${response.split('/').pop()}`; // Extract the room ID from the response
    // }


};

// Listen for messages from other users
socket.on('chat message', (msg) => {
    term.echo(msg);
});

socket.on('whisper message', (usr, msg) => {
    const username = localStorage.getItem('username');
    if (usr === username){
        term.echo(msg);
    }
});

socket.on('invitation', (invited_user, hostUser, room_id) => {
    term.echo(`<green>TQ: </green>[[;yellow;]${hostUser} has invited you to join room ${room_id}. Click here to [[!;;;;/game.html?roomId=${room_id}]Join Room]].`);
});



const command_list = ['clear'].concat(Object.keys(commands));
const formatted_list = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});
const help = formatter.format(formatted_list);

// Format commands as they are typed:
const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);

const username = localStorage.getItem('username');

const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

// Set up terminal
 const term = $('body').terminal(function(command, term) {
    const username = localStorage.getItem('username');
    
    // Check if chatMode is active
    if (chatMode) {
        // If the user types 'exit', exit chat mode
        if (quit_chat_commands.includes(command.trim().toLowerCase())) {
            chatMode = false;
            term.echo('<yellow>Chat mode deactivated. You are back to command mode.</yellow>');
            term.set_prompt(`<white>${username}</white>@tq.lobby> `)
        } else {
            // Treat all input as a chat message
            const timestamp = new Date().toLocaleTimeString();
            const chatMessage = `${timestamp} ${username}:\t\t${command}`; 
            socket.emit('chat message', chatMessage); // Send to server
        }
    } else {
        const parts = command.trim().split(/\s+/); // Split by whitespace
        const cmd = parts[0]; // First part is the command
        const args = parts.slice(1); // Rest are the arguments

        // Check if the command exists
        if (commands[cmd]) {
            // Call the specific command and pass any arguments
            commands[cmd](...args);
        } else {
            term.echo(`Unknown command: ${cmd}`);
        }
    }
}, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: function(string, callback) {
        if (!chatMode) {
             const availableCommands = Object.keys(commands);
            const suggestions = availableCommands.filter(cmd => cmd.startsWith(string));
            callback(suggestions);   
        } else {
             callback([]);
        }
    },
    prompt: `<white>${username}</white>@tq.lobby> `,
    history: true
    // onBlur: function() {
    //     // Prevents losing focus
    //     return false;
    // }
});

//term.pause();

function ready() {
    term.echo(() => {
        term.echo(() => render('Terminal Consequences: '))       
        .echo(`<white>YOU ARE LOGGED IN AS </white> <red>${username}</red> <white> ... Welcome to the chat.</white> \n`).resume();
      });
}

function render(text) {
    const cols = term.cols();
    return figlet.textSync(text, {
        font: font,
        width: cols,
        whitespaceBreak: true
    });
}

term.on('click', '.command', function() {
    const command = $(this).text();
    term.exec(command);
 });

socket.on('disconnect', () => {                                 
    const username = localStorage.getItem('username');
    console.log(`Client disconnected: ${username}`);        
    socket.emit('userLogout', username);
});