/**
 * This script sets up the terminal interface for the lobby section of the "Terminal Consequences" application, 
 * allowing users to interact with the game lobby, see other players, and join or create game rooms. It integrates 
 * with Socket.IO for real-time updates and provides commands for interacting within the lobby.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 * 
 * @example
 * // Example of terminal commands in the lobby:
 * > list users        // Displays a list of users currently in the lobby.
 * > creategame        // Creates a new game room with a randomly generated id.
 * > join game1        // Joins the game room called "game1".
 * > say Hello!        // Sends a chat message "Hello!" to other users in the lobby.
 */


// Determine if we are in development or production based on the window location
const isDevelopment = window.location.hostname === 'localhost'; 
const socket = io(isDevelopment ? 'http://localhost:5000' : 'https://terminal-6xn7.onrender.com', {
    transports: ['websocket', 'polling'] // Use both websocket and polling transports
});

let chatMode = false;
let timestamp = new Date().toLocaleTimeString();
const quit_chat_commands = ['!exit', '!chatmode' ]
const username = localStorage.getItem('username');

socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server');
    socket.emit('userLogin', username);
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
    console.log(err.message);
    console.log(err.description);
    console.log(err.context);
});

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
                    term.echo(`No spesific information on ${command_name} \nList of available commands: ${commands_formatted_for_help}.`);
                } else {
                    term.echo(`List of available commands: ${commands_formatted_for_help}. Type help *command* for info on spesific command.`);
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
            term.set_prompt('<yellow>chat</yellow>> ');
        }
    },

    refresh(){
        term.exec('clear');
        ready();
    },

    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        term.echo('You have been logged out successfully, bye!');
        socket.emit('userLogout', username);                                                //TODO: Do this also for disconnect etc ????

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    },

    exit: function() {   
        term.exec('logout');
    },

    say(message) {
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
                if (Object.keys(users).length > 0) {                    // Use Object.keys() for an object or .length for an array
                    const userList = Object.keys(users).join(', ');     // Join the keys of the object (usernames)
                    term.echo(`Currently logged in users: ${userList}`);
                } else {
                    term.echo('No users are currently logged in.');
                }
            });
        }
        else if (variable = 'rooms') {
            socket.emit('getRoomList', roomList => {
                number_of_rooms = Object.keys(roomList).length
                if (number_of_rooms === 0) {
                    term.echo("No rooms are active.")
                } else {
                    const roomEntries = Object.entries(roomList).map(([roomId, roomData]) => {
                        return `${roomData.settings.host}:${roomId}`;
                    });
                    const roomListString = roomEntries.join(', ');
                    term.echo(`There are currently ${number_of_rooms} rooms: ${roomListString}`)
                }
            });
        } else {
            term.echo('list what?');
        }
    },

    who() {
        term.exec('list users');
    },

    whisper(to_username, message){
        socket.emit('requestUserList', (users) => {
            if (users[to_username]){
                const whisperMessage = `${timestamp}  ${username} whispers: \t\t<pink>${message}</pink>`;
                socket.emit('whisper message', to_username, whisperMessage);             
                term.echo(whisperMessage);
            } else {
                term.echo(`<red>Error:</red> ${to_username} is offline or does not exist.`)
            } 
        });
    },

    creategame() {
        socket.emit('creategame', username, (response) => {            
            term.echo(`Game created at: ${response}`);  
            roomId = response.split('/').pop();
            socket.emit('joinGame', roomId, username, (response) => {
                console.log(`In Game Response: ${response}`);
            });
            window.location.href = `game.html?roomId=${roomId}`; // Extract the room ID from the response
        });
    },

    join(room_id){                                                  
        socket.emit('requestJoin', username, room_id, (response) => {
            term.echo(response.message);
            if (response.room_exists && response.invitation){
                socket.emit('joinGame', room_id, username, (response) => {
                    console.log(`In Game Response: ${response}`);
                });
                window.location.href = `game.html?roomId=${room_id}`;
            }
        });
    }
};

socket.on('chat message', (msg) => {
    term.echo(msg);
});

socket.on('whisper message', (usr, msg) => {
    if (usr === username){
        term.echo(msg);
    }
});

socket.on('invitation', (hostUser, room_id) => {
    term.echo(`<green>TQ: </green>[[;yellow;]${hostUser} has invited you to join room ${room_id}. Click here to [[!;;;;/game.html?roomId=${room_id}]Join Room]].`);

    // Attach a handler for when the user clicks the link
    term.on('click', (e) => {
        const target = $(e.target);
        // Detect if the user clicked the terminal link
        if (target.text() === 'Join Room') {            
            // Emit 'userJoin' when the link is clicked
            socket.emit('joinGame', room_id, username, (response) => {
                console.log(`In Game Response: ${response}`);
            });
            window.location.href = `/game.html?roomId=${room_id}`;
        }
    });
});


// Inline and help-command formatting:
const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });
const command_list = ['clear'].concat(Object.keys(commands));
const formatted_list = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});
const commands_formatted_for_help = formatter.format(formatted_list);

const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);


const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art
figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

// Set up jQuery Terminal:
const term = $('body').terminal(function(command, term) {    
    if (chatMode) {
        if (quit_chat_commands.includes(command.trim().toLowerCase())) {
            chatMode = false;
            term.echo('<yellow>Chat mode deactivated. You are back to command mode.</yellow>');
            term.set_prompt(`<white>${username}</white>@tq.lobby> `)
        } else {
            const timestamp = new Date().toLocaleTimeString();
            const chatMessage = `${timestamp} ${username}:\t\t${command}`; 
            socket.emit('chat message', chatMessage);
        }
    } else {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];  
        const args = parts.slice(1); 
        if (commands[cmd]) {
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
});

term.pause();
function ready() {
    const welcome_message = render('Terminal Consequences');
    term.echo(welcome_message);
    term.echo(`<white>YOU ARE LOGGED IN AS </white> <red>${username}</red> <white> ... Welcome to the chat.</white> \n`);
    if (socket.connected) {
        term.echo("<yellow>Connected!</yellow>");
    } else {
        term.echo("<yellow>Connecting... </yellow>"); 
    }
    term.resume();
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
    console.log(`Client disconnected: ${username}`);     
});