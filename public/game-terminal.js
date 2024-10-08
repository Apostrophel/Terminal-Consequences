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

    mode(){
        term.echo(`Chatmode is currently: ${chatMode}`)
    },

    refresh(){
        this.exec('clear');
        ready();
    },
   
    enterChatMode() {
        chatMode = true;
        term.echo('You are now in chat mode. Type your message and hit Enter to send.');
    },

    exitChatMode() {
        chatMode = false;
        term.echo('Exited chat mode. You can now enter commands.');
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

    exit: function() {  // Define exit as a function reference
        this.exec('logout'); // Call logout when exit is invoked
    },

    say(message) {
        const username = localStorage.getItem('username');

        if (username && message) {
            const chatMessage = `${timestamp}  ${username}:\t\t${message}`;
            socket.emit('chat message', chatMessage);               //sends the message to all connected clients.
            //term.echo(`[[;green;]${username}]: ${message}`);

        } else if (message == null) {
            term.echo('Please provide message.');
        } else {
            term.echo('Please log in to chat.');
        }
    },

    list(variable) {

        if (variable === "users") {
            
            socket.emit('requestUserList', (users) => {
                if (users.length > 0) {
                    term.echo('Currently logged in users:');
                    users.forEach(user => {
                        term.echo(user);
                    });
                } else {
                    term.echo('No users are currently logged in.');
                }
            });

        } else {
            term.echo('list what?');
        }

    },

    // Command to create a game
    creategame() {
    socket.emit('creategame', username, (response) => {
        term.echo(response); // Show the room ID or any feedback
    });
}


};

// Listen for messages from other users
socket.on('chat message', (msg) => {
    term.echo(msg);
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


const username = localStorage.getItem('username');

const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: true,
    prompt: `<white>${username}</white>@tq.lobby> `
});

//term.pause();



function ready() {
    term.echo(() => {
        term.echo(() => render('Terminal Consequences'))
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