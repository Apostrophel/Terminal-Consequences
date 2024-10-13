/**
 * This script manages the terminal interface for individual game sessions within "Terminal Consequences". 
 * It handles player commands, game logic, and real-time updates using Socket.IO. The script allows players 
 * to communicate, make in-game decisions, and interact with other players in the game environment.
 * 
 * @project Terminal Consequences
 * @author: sjurbarndon@proton.me
 * 
 * @example
 * // Example of terminal commands during a game session:
 * > attack player2    // Initiates an attack on "player2".
 * > defend            // Executes a defense action.
 * > chat Nice move!   // Sends the chat message "Nice move!" to other players in the game.
 * > quit              // Exits the current game and returns to the lobby.                              //TODO: none of this is not impemented
 */

// Determine if we are in development or production based on the window location
const isDevelopment = window.location.hostname === 'localhost'; 
const socket = io(isDevelopment ? 'http://localhost:5000' : 'https://terminal-6xn7.onrender.com', {
    transports: ['websocket', 'polling'] // Use both websocket and polling transports
});

// Extract the roomId from the URL (e.g., /game/:roomId)
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
console.log(roomId);

const username = localStorage.getItem('username');
const quit_chat_commands = ['!exit', '!chatmode' ]
let chatMode = false;
let timestamp = new Date().toLocaleTimeString(); // 11:18:48

socket.emit('joinGame', roomId, username, (response) => {
    console.log(`In Game Response: ${response}`);
});

socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server and game lobby');
    const username = localStorage.getItem('username');
    socket.emit('userLogin', username);                                                 //TODO: Change to userJoin ??
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
                        term.echo(`No spesific information on ${command_name} \nList of available commands: ${host_commands_formatted_for_help}.`);
                    } else {
                        term.echo(`List of available commands: ${host_commands_formatted_for_help}. Type help *command* for info on spesific command.`);
                    }   
                } else {

                    if (command_name != null) {
                        term.echo(`No spesific information on ${command_name} \nList of available commands: ${commands_formatted_for_help}.`);
                    } else {
                        term.echo(`List of available commands: ${commands_formatted_for_help}. Type help *command* for info on spesific command.`);
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
        term.exec('leave'); // Call logout when exit is invoked
    },

    say(message) {
        const username = localStorage.getItem('username');

        if (username && message) {
            const chatMessage = `${timestamp}  ${username}:\t\t${message}`;
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
                    socket.emit('getRoomUsers', roomId, (callback) => {
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
            socket.emit('getRoomUsers', roomId, (users) => {
                
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
        term.exec('list users lobby');
    },

    whisper(to_username, message){
        socket.emit('requestUserList', (users) => {
            if (users[to_username]){
                const username = localStorage.getItem('username');
                const whisperMessage = `${timestamp}  ${username} whispers: \t\t<pink>${message}</pink>`;
                socket.emit('whisper message', to_username, whisperMessage);           
                term.echo(whisperMessage);
            } else {
                term.echo(`<red>Error:</red> ${to_username} is offline or does not exist.`)
            } 
        });
    },
    // invite(user){                                                        //TODO: let users try invite command and check if priviliges are granted
    //     socket.emit('getRoomData', roomData => {
    //         guest_invite_enabled = roomData.settings.guestInvite;
    //         if(guest_invite_enabled){
    //             socket.emit('requestUserList', (users) => {
    //                 if (users[user]){
    //                         socket.emit('invite', roomId, user, username, (callback) => {
    //                         term.echo(callback)
    //                     });
    //                 }else {
    //                     term.echo(`<red>Error:</red> ${user} is offline or does not exist.`)
    //                 }
    //             });
    //         } else {
    //             term.echo(`<red>Host has not granted invite privileges.</red>`)
    //         }
    //     });
    // },

};

// Listen for game messages and display them
socket.on('gameMessage', msg => {
    console.log(`Received from server: ${msg}`)
        term.echo(msg);
});

// Listen for whisper messages and display them             //TODO: change this to a socket message directly to user?
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
const commands_formatted_for_help = formatter.format(formatted_list);
const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);


const font = 'Elite';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

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
            socket.emit('gameMessage', roomId, chatMessage); //Send message with roomId                                //TODO: Change to ***character name***

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
    prompt: `<white>${username}</white>@tq.game> `,
    history: true
});


//term.pause();

function ready() {
    const username = localStorage.getItem('username');
    let lobby_name = "Temp Name";        //TODO: Get lobby name from server room data. Issue #25.

    socket.emit('getRoomData', roomId, (roomData) => {
         lobby_name = roomData.settings.gameName;
         term.echo(() => {
            term.echo(() => render(`Terminal Consequences: ${lobby_name}`))  
            .echo(`<white> User: </white> <red>${username}</red> <white> ... Welcome to Game: ${lobby_name}.</white> \n`).resume(); //TODO: lobby name and id below
          });

    });

    socket.emit('getRoomUsers', roomId, (callback) => {
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

term.on('click', 'a', function(event) {
    event.preventDefault(); // Prevent default action of the link (which would be navigating to '#')
    
    const text = $(this).text();
    const match = text.match(/Let\s(\S+)\sjoin/);
    if (match && match[1]) {
        const invited_username = match[1]; // Get the username from the matched pattern
        socket.emit('letUserJoin', roomId, invited_username, username);
        term.echo(`<yellow>Invitation sent to ${invited_username}</yellow>`);
    }
});

// Below is to add host-specific commands
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

        setname(new_name){
            socket.emit('changeRoomName', roomId, new_name, (callback) => {
                term.echo(callback)
                term.exec('refresh');
            });
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
        },
    };

function addHostCommands() {
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
    host_commands_formatted_for_help = formatter.format(formatted_list);

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

term.on('click', '.command', function() {
    const command = $(this).text();
    term.exec(command);
 });

socket.on('disconnect', () => {                                 //TODO: This dosnnt work? 
    const username = localStorage.getItem('username');
    console.log(`Client disconnected: ${username}`);        
    socket.emit('userLogout', username);
});