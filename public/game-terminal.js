// Determine if we are in development or production based on the window location
const isDevelopment = window.location.hostname === 'localhost'; 

// Use the appropriate Socket.IO server URL based on the environment
const socket = io(isDevelopment ? 'http://localhost:5000' : 'https://terminal-6xn7.onrender.com', {
    transports: ['websocket', 'polling'] // Use both websocket and polling transports
});


// Extract the roomId from the URL (e.g., /game/:roomId)
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId'); // Extracts the value of 'roomId' parameter
console.log(roomId); // Outputs: ZayB

const username = localStorage.getItem('username');

socket.emit('joinGame', roomId, username, (response) => {
    console.log(`In Game Response: ${response}`); // Log the response from the server
});

socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server and game lobby');
        const username = localStorage.getItem('username');

    socket.emit('userLogin', username);                     //TODO: Change to userJoin
    
    
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
    console.log(err.message);
    console.log(err.description);
    console.log(err.context);
});

const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });
  
  
let chatMode = false;
let timestamp = new Date().toLocaleTimeString(); // 11:18:48

//game settings:
let lobby_name = 'Game Lobby';
//...

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

                if( localStorage.getItem('current_role') === 'host'){
                    if (command_name != null) {
                        term.echo(`No spesific information on ${command_name} \nList of available commands: ${help}.`);
                    } else {
                        term.echo(`List of available HOST commands: ${help}. Type help *command* for info on spesific command.`);
                    }   
                } else {

                    if (command_name != null) {
                        term.echo(`No spesific information on ${command_name} \nList of available commands: ${help}.`);
                    } else {
                        term.echo(`List of available commands: ${help}. Type help *command* for info on spesific command.`);
                    }   
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
            term.echo('You are now in chat mode. Type your message and hit Enter to send.');
        }
    },

    refresh(){
        this.exec('clear');
        ready();
    },
   
    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        term.echo('You have been logged out successfully, bye!');

        const username = localStorage.getItem('username');
        socket.emit('userLogout', username);                        //TODO: Do this also for disconnect etc ????

        setTimeout(() => {
            window.location.href = 'index.html'; // Replace with your login page URL
        }, 500); // 1 second delay for user feedback before redirecting
    },

    leave() {
        term.echo('You have left the game, bye!');
        const username = localStorage.getItem('username');
        socket.emit('userLeft', username, roomId);

        setTimeout(() => {
            window.location.href = 'lobby.html'; // Replace with your login page URL
        }, 500); // 1 second delay for user feedback before redirecting

    },

    exit: function() {  // Define exit as a function reference
        this.exec('leave'); // Call logout when exit is invoked
    },

    say(message) {
        const username = localStorage.getItem('username');

        if (username && message) {
            const chatMessage = `${timestamp}  ${username}:\t\t${message}`;
            //socket.emit('chat message', chatMessage);               //sends the message to all connected clients.
            socket.emit('gameMessage', roomId, chatMessage); //Send message with roomId                                //TODO: Change to ***character name***

        } else if (message == null) {
            term.echo('Please provide message.');
        } else {
            term.echo('Please log in to chat.');
        }
    },

    list(variable, location) {

        if (variable && location){
            if(variable === 'users'){
                if (location === 'in lobby' || location === 'lobby'){
                    socket.emit('get room users', roomId, (callback) => {
                        const lobby_clients = Object.keys(callback).join(', ');  // Join the keys of the object (usernames)
                        term.echo(`Players in lobby: ${lobby_clients}`);
                    });
                } else {
                    term.echo(`<red>Invalid argument: </red> ${location} `)
                }
            }
                
        } else if (variable === "users") {
            
            socket.emit('requestUserList', (users) => {
                if (Object.keys(users).length > 0) { // Use Object.keys() for an object or .length for an array
                    const userList = Object.keys(users).join(', ');  // Join the keys of the object (usernames)
                    term.echo(`Currently logged in users: ${userList}`);
                } else {
                    term.echo('No users are currently logged in.');
                }
            });

        } else if (variable === 'roles') {
            socket.emit('get room users', roomId, (users) => {
                
                const lobbyClients = Object.keys(users).map(username => {
                    const role = users[username].role; // Access the role associated with the username
                    return `${username} (${role})`; // Format the output
                });
            
                // Join the array into a string and echo it
                term.echo(`Player roles in lobby: ${lobbyClients.join(', ')}`);

            });

        } else {
            term.echo('Use command: list <parameter> <location>');
        }

    },

    who() {
        this.exec('list users lobby');
    },

    whisper(to_username, message){
        const username = localStorage.getItem('username');
        const whisperMessage = `${timestamp}  ${username} whispers: \t\t<pink>${message}</pink>`;
        socket.emit('whisper message', to_username, whisperMessage);               //sends the message to all connected clients.

    },

    setname(new_name){
        lobby_name = new_name;
        this.exec('refresh');
    },
    
    invite(user){
        socket.emit('requestUserList', (users) => {
            if (users[user]){
                    socket.emit('invite', roomId, user, username, (callback) => {
                    term.echo(callback)
                });
            }else {
                term.echo(`<red>Error:</red> ${user} is offline or does not exist.`)
            }
    
        });
       
    }

};

// Listen for game messages and display them
socket.on('gameMessage', msg => {
    console.log(`Received from server: ${msg}`)
        term.echo(msg);
});
// Listen for whisper messages and display them     //TODO: change this to a socket message directly to user?
socket.on('whisper message', (usr, msg) => {
    const username = localStorage.getItem('username');
    if (usr === username){
        term.echo(msg);
    }
});

const command_list = ['clear'].concat(Object.keys(commands));
const formatted_list = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});
const help = formatter.format(formatted_list);

const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
 
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);


const font = 'Elite';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: true,
    prompt: `<white>${username}</white>@tq.game> `
});

//term.pause();

function ready() {
    const username = localStorage.getItem('username');
    term.echo(() => {
        term.echo(() => render(`Terminal Consequences: ${lobby_name}`))  
        .echo(`<white> User: </white> <red>${username}</red> <white> ... Welcome to Game: ${lobby_name}.</white> \n`).resume(); //TODO: lobby name and id below
      });

    socket.emit('get room users', roomId, (callback) => {
        //lobby_clients = callback.join(', ');
        const lobby_clients = Object.keys(callback).join(', ');  // Join the keys of the object (usernames)

        term.echo(`<green>Game Lobby: </green>Users in lobby: ${lobby_clients}`);
    });

    // After joining the room, fetch the user's role
    
    socket.emit('getUserData', username, roomId, (userData) => {
        localStorage.setItem('current_role', userData.role);
        if (userData.role === 'host') {
            term.echo('<green>Game Lobby: </green> You are the host! ');
            addHostCommands();  // Call a function to add host-specific commands
            updateCommandListAndFormatting();  // Update the command list and formatting
        }
    });
}



// Function to add host-specific commands
//function addHostCommands() {
    const hostCommands = {
        startgame() {
            term.echo("Not impemented yet");
            socket.emit('startGame', roomId, (response) => {
                term.echo(response);
            });
        },
        kick(usernameToKick) {
            if (usernameToKick) {
                socket.emit('kickUser', roomId, usernameToKick, (response) => {
                    term.echo(response);
                });
            } else {
                term.echo('Specify a username to kick.');
            }
        },
        endgame() {
            socket.emit('endGame', roomId, (response) => {
                term.echo(response);
            });
        },
        setrole(username, role) {
            socket.emit('setUserRole', roomId, username, role, (response) => {
                term.echo(response);
            });
        },
    };
    //Object.assign(commands, hostCommands); // Extend the existing commands object
//}

function addHostCommands() {
    // Object.keys(hostCommands).forEach(commandName => {
    //     commands[commandName] = hostCommands[commandName];  // Assign the function to the commands object
    // });
    Object.assign(commands, hostCommands); // Extend the existing commands object

}

function updateCommandListAndFormatting() {
    // Regenerate command_list to include new commands
    const command_list = ['clear'].concat(Object.keys(commands));

    // Regenerate the formatted list for displaying in help
    const formatted_list = command_list.map(cmd => {
        return `<white class="command">${cmd}</white>`;
    });

    // Update the help variable with the new command list
    help = formatter.format(formatted_list);

    // Update the regular expressions with the new command list
    const any_command_re = new RegExp(`^\\s*(${command_list.join('|')})`);
    const re = new RegExp(`^\\s*(${command_list.join('|')})(\\s?.*)`);

    // Update the terminal formatter to handle new commands
    $.terminal.new_formatter([re, function(_, command, args) {
        return `<white>${command}</white><aqua>${args}</aqua>`;
    }]);

    term.update();
 }

function render(text) {
    const cols = term.cols();
    return figlet.textSync(text, {
        font: font,
        width: cols,
        whitespaceBreak: true
    });
}

function rainbow(string) {
    return lolcat.rainbow(function(char, color) {
        char = $.terminal.escape_brackets(char);
        return `[[;${hex(color)};]${char}]`;
    }, string).join('\n');
}

function hex(color) {
    return '#' + [color.red, color.green, color.blue].map(n => {
        return n.toString(16).padStart(2, '0');
    }).join('');
}



term.on('click', '.command', function() {
    const command = $(this).text();
    term.exec(command);
 });

 // Override the terminal's command input to handle chat mode
 term.on('command:enter', function(command) {
    term.echo("THE WORKS")
    if (chatMode) {
        term.echo("i was here")
        // If in chat mode, treat input as a message
        commands.say(command); // Directly call the say method
    } else {
        // Otherwise, process as a normal command
        this.exec(command);
    }
});


socket.on('disconnect', () => {                                 //TODO: This dosnnt work? 
    const username = localStorage.getItem('username');
    console.log(`Client disconnected: ${username}`);        
    socket.emit('userLogout', username);
});