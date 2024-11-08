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
const userColour = localStorage.getItem('user_colour');
const quit_chat_commands = ['!exit', '!chatmode' ];
let chatMode = false;
let timestamp = new Date().toLocaleTimeString();

socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server and game lobby');
    const username = localStorage.getItem('username');
    socket.emit('userLogin', username);                                                
    socket.emit('joinGame', roomId, username, (response) => {
        console.log(`In Game Response: ${response}`);
    });
});

socket.on('connect_error', (err) => {
    term.echo(`<red>Connection error: ${err.message}</red>`)
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
                        term.echo(`No spesific information on ${command_name} \nList of available commands:${commands_formatted_for_help}, ${host_commands_formatted_for_help}.`);
                    } else {
                        term.echo(`List of available commands:\t ${commands_formatted_for_help}. Type [<white>help</white> *<aqua>command</aqua>*] for info on spesific command.`);
                        term.echo(`List of in-game commands:\t ${in_game_commands_formatted_for_help}`)
                        term.echo(`Host specific commands:\t\t ${host_commands_formatted_for_help}.`);
                    }   
                } else {

                    if (command_name != null) {
                        term.echo(`No spesific information on ${command_name} \nList of available commands: ${commands_formatted_for_help}.`);
                    } else {
                        term.echo(`List of available commands:\t ${commands_formatted_for_help}. Type help *command* for info on spesific command.`);
                        term.echo(`List of in-game commands\t: ${in_game_commands_formatted_for_help}`)

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
        socket.emit('userLogout', username);                       

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500); // 1 second delay for user feedback before redirecting
    },

    leave() {
        if(localStorage.getItem('current_role') === 'host'){
            term.read('Are you sure you want to close the lobby? (y/n): ').then(hostInput => {
                if(hostInput === 'y' || hostInput === 'Y' || hostInput === 'yes' || hostInput === 'Yes' || hostInput === 'YES'){
                    socket.emit('gameMessageAlert', roomId, `<green>Game Lobby: </green>Host (${username}) as left the game and the lobby will close in 3 seconds.`)
                    setTimeout(() => {
                        socket.emit('closeLobby', roomId, (response) => {
                            term.echo(response);
                            window.location.href = 'lobby.html';
                        });
                    }, 3000);
                } 
            });
        } else {
            term.echo('You have left the game, bye!');
            const username = localStorage.getItem('username');
            socket.emit('userLeft', username, roomId);
            setTimeout(() => {
                window.location.href = 'lobby.html';
            }, 500);
                
        }
    },

    exit: function() { 
        term.exec('leave');
    },


    say(...args) {
        if (username && args.length > 0) {
            let message = args.join(' ');
            socket.emit('gameMessage', username, userColour, roomId || null, message);          //TODO: change to charachter name ??

            let timestamp = new Date().toLocaleTimeString();
            term.echo(`${timestamp} [[;${userColour};]${username}]:\t\t${message}`); 


        } else if (args.length === 0) {
            term.echo('Please provide a message.');
        } else {
            term.echo('Please log in to chat.');
        }
    },

    list(variable, location) {
        if (variable && location){
            if(variable === 'users'){
                if (location === 'in lobby' || location === 'lobby' || location === 'game'){
                    socket.emit('getRoomUsers', roomId, (callback) => {
                        const lobby_clients = Object.keys(callback).join(', '); 
                        term.echo(`Players in lobby: ${lobby_clients}`);
                    });
                } else {
                    term.echo(`<red>Invalid argument: </red> ${location} `)
                }
            }
                
        } else if (variable === "users") {
            
            socket.emit('requestUserList', (users) => {
                if (Object.keys(users).length > 0) {  
                    const userList = Object.keys(users).join(', '); 
                    term.echo(`Currently logged in users: ${userList}`);
                } else {
                    term.echo('No users are currently logged in.');
                }
            });

        } else if (variable === 'roles') {
            socket.emit('getRoomUsers', roomId, (users) => {
                
                const lobbyClients = Object.keys(users).map(username => {
                    const role = users[username].role; // TODO: Access the role associated with the username
                    return `${username} (${role})`;
                });
                term.echo(`Player roles in lobby: ${lobbyClients.join(', ')}`);

            });
        } else {
            term.echo('Use command: list <parameter> <location>');
        }
    },

    who() {
        term.exec('list users lobby');
    },

    whisper(to_username, ...args){
        if(to_username && args.length > 0){
            let message = args.join(' ');
            socket.emit('requestUserList', (users) => {
                if (users[to_username]){
                    const username = localStorage.getItem('username');
                    const whisperMessage = `${timestamp}  ${username} whispers: \t\t<pink>${message}</pink>`;
                    socket.emit('whisper message', to_username, whisperMessage);             
                    term.echo(whisperMessage);
                } else {
                    term.echo(`<white>${username}</white>@tq.game> <white>whisper</white> <aqua>${to_username} ${args.join(' ')}</aqua>`)
                    term.echo(`<red>Error:</red> ${to_username} is offline or does not exist.`)
                } 
            });
        } else if (to_username && args.length === 0){
            term.echo(`<white>${username}</white>@tq.game> <white>whisper</white> <aqua>${to_username} ${args.join(' ')}</aqua>`)
            term.echo("<red>Provide a username and message.</red>")
        } else {
            term.echo(`<white>${username}</white>@tq.game> <white>whisper</white>`)
            term.echo("<red>Provide a username and message.</red>")
        }
    },

    invite(user){                                                        //TODO: guestInvite set command AND check if user already joined
        if(localStorage.getItem('current_role') === 'host' ){
            hostCommands.invite(user); 
        } else {
            socket.emit('getRoomData', roomId, roomData => {
                guest_invite_enabled = roomData.settings.guestInvite;
                if(guest_invite_enabled){
                    socket.emit('requestUserList', (users) => {
                        if (users[user]){
                                socket.emit('invite', roomId, user, username, (callback) => {
                                term.echo(callback)
                            });
                        }else {
                            term.echo(`<red>Error:</red> ${user} is offline or does not exist.`)
                        }
                    });
                } else {
                    term.echo(`<red>Host has not granted invite privileges.</red>`)
                }
            });
        }
    },

};

// Below is to add host-specific commands
const hostCommands = {
    closelobby() {
        term.read('Are you sure you want to close the lobby? y/n ').then(hostInput => {
            if(hostInput === 'y' || hostInput === 'Y' || hostInput === 'yes' || hostInput === 'Yes' || hostInput === 'YES'){
                socket.emit('closeLobby', roomId, (response) => {
                    term.echo(response);
                });
            }
        });
        
    },
    startgame() {
        term.echo("Not impemented yet");
        socket.emit('startGame', roomId, (response) => {
            term.echo(response);
        });

        updateIngameCommands();
        
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

const gameCommands = {
    whisperc(...args){     //TODO: character whisper 
        if (username && args.length > 0) {
            let message = args.join(' ');
            let whisper = username + " wishpers " + message;
            socket.emit('gameMessage', username, roomId || null, whisper);          //TODO: change to charachter name ??
            
            let timestamp = new Date().toLocaleTimeString();
            term.echo(`you gently whisper ${message}`); 
        } else {
            term.echo('Please provide a message.');
        }
    },
    
    shout(...args){
        if (username && args.length > 0) {
            let message = args.join(' ');
            let whisper = username + " shout " + message;
            socket.emit('gameMessage', username, roomId || null, whisper);          //TODO: change to charachter name ??
            
            let timestamp = new Date().toLocaleTimeString();
            term.echo(`you shout ${message}`); 
        } else {
            term.echo('Please provide a message.');
        }
    },

    map() {

        renderMap();    //TODO: this
    },

}


// Listen for game messages and display them
socket.on('gameMessage', (user_name, user_colour, message) => {
    const username = localStorage.getItem('username');
    if (user_name !== username) {
        let local_timestamp = new Date().toLocaleTimeString();
        term.echo(`${local_timestamp} [[;${user_colour};]${user_name}]:\t\t${message}`);  
    }
});

socket.on('joinMessage', (user_name, message) => {
    if (user_name !== username){
        term.echo(message);
    }
});
socket.on('gameMessageAlert', (msg) => {
    term.echo(msg);
});

socket.on('loadChatHistory', (chatLogs) => {
    if (chatLogs && Array.isArray(chatLogs)) {
        chatLogs.reverse().forEach(log => {
            const log_username = log.userId;
            const userid_colour = log.userColour;
            const log_message = log.message;
            const log_timestamp = new Date(log.timestamp).toLocaleTimeString(); // Assuming log has a timestamp
            term.echo(`${log_timestamp} [[;${userid_colour};]${log_username}]:\t\t${log_message}`);

        });
    } else {
        term.echo('No chat logs found.');
    }
});

// Listen for whisper messages and display them             //TODO: change this to a socket message directly to user?
socket.on('whisper message', (usr, msg) => {
    const username = localStorage.getItem('username');
    if (usr === username){
        term.echo(msg);
    }
});

socket.on('redirect', (data) => {
    window.location.href = data.url;  // Redirects the user to the new URL
});

const command_list = ['clear'].concat(Object.keys(commands));
const host_commands_list = ['clear'].concat(Object.keys(hostCommands));
const ingame_commands_list = ['clear'].concat(Object.keys(gameCommands));

const formatted_list = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});

const formatted_host_list = host_commands_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});

const formatted_game_list = ingame_commands_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});

const commands_formatted_for_help = formatter.format(formatted_list);
const host_commands_formatted_for_help = formatter.format(formatted_host_list);
const in_game_commands_formatted_for_help = formatter.format(formatted_game_list);

const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);

let onMobile = isMobileDevice();
let font = 'Elite';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

if (onMobile){
    font = 'Ogre';
}

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

// Set up jQuery Terminal:
const term = $('body').terminal(function(command, term) {    
    if (chatMode) {
        if (quit_chat_commands.includes(command.trim().toLowerCase())) {
            chatMode = false;
            term.echo('<yellow>Chat mode deactivated. You are back to command mode.</yellow>');
            term.set_prompt(`<white>${username}</white>@tq.game> `)
        } else {
            const timestamp = new Date().toLocaleTimeString();
            term.echo(`${timestamp} ${username}:\t\t${command}`);             //TODO: Change to ***character name***
            socket.emit('gameMessage', username, roomId || null, command); // Ensure roomId is not undefined
        }
    } else {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0];  
        const args = parts.slice(1); 

        if (cmd !== 'say' && cmd !== 'whisper'){
            if (commands.hasOwnProperty(cmd) || hostCommands.hasOwnProperty(cmd)) {
                echoCommand(`<white>${username}</white>@tq.game> <white>${cmd}</white> <aqua>${args.join(' ')}</aqua>`);
            }
        }
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
    history: true,
    echoCommand: false
});


term.pause();
function ready() {
    const username = localStorage.getItem('username');
    let lobby_name = "Temp Name";  
    
    socket.emit('getRoomData', roomId, (roomData) => {
        lobby_name = roomData.settings.gameName;
        let welcome_message = render('Terminal Consequences: ');
        if (onMobile){
            welcome_message = render('Terminal\nConsequences:')
        }

        term.echo(welcome_message);
        term.echo(`<white> User: </white> <red>${username}</red> <white> ... Welcome to Game: ${lobby_name}.</white> \n`);
        if (socket.connected) {
            term.echo("<yellow>Connected!</yellow>");       //TODO: this is not working as intened ?
        } else {
            term.echo("<yellow>Connecting... </yellow>"); 
        }

        if(roomData.settings.host === username){
            localStorage.setItem('current_role', 'host');
        } else {
            localStorage.setItem('current_role', 'guest');
        }
        if (roomData.settings.host === username) {
            term.echo('<green>Game Lobby: </green>You are the host! ');
            addHostCommands();   
        }

    });

    socket.emit('getRoomUsers', roomId, (callback) => {
        const lobby_clients = Object.keys(callback).join(', ');  // Join the keys of the object (usernames)
        term.echo(`<green>Game Lobby: </green>Users in lobby: ${lobby_clients}`);
    });

 
    socket.emit('requestChatLog', roomId);
    term.resume();
}

function echoCommand(line){
    term.echo(line);
}

function updateIngameCommands(){
    socket.emit('getRoomData', roomId, (roomData) => {
        if (roomData.settings.host === username) {
            Object.assign(commands, hostCommands, gameCommands); // Extend the existing commands object
        } else {
            Object.assign(commands, gameCommands);
        }
        term.update();
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

function addHostCommands() {
    Object.assign(commands, hostCommands); // Extend the existing commands object
}

function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 800;
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
});



/*
* +----------------+                                   +----------------+
* | Drawing room   |                                   | Dining hall    |
* |                |                                   |                |
* |                |                                   |                |
* |                |                                   |                |
* |                |                                   |                |
* |                |-----------------------------------|                |
* |                | Foyer                             |                |
* |                |                                   |                |
* |                |                \ /                |                |
* |                |                 x <-- you here    |                |
* |                |                / \                |                |
* |                |                                   |                |
* |                |                                   |                |
* +----------------+----+-------------------------+----+----------------+
*                       | Entrance      |         |                      
*                       |               |         |                      
*                       |               |         |                      
*                       |               |         |                      
*                       |               |         |                      
*                       +-------------------------+                      
*/