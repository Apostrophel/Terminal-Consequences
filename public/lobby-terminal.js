
//const socket = io('http://localhost:5000', {transports: ['websocket']});
const socket = io('https://terminal-6xn7.onrender.com', {transports: ['websocket']});


socket.on('connect', () => {
    console.log('Successfully connected to the Socket.IO server');
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
  

const commands = {
    help() {
        term.echo(`List of available commands: ${help}`);
    },
    echo(...args) {
        if (args.length > 0) {
            term.echo(args.join(' '));
        }
    },
   
    //LOBBY COMMANDS:

    logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        term.echo('You have been logged out successfully!');

        setTimeout(() => {
            window.location.href = 'index.html'; // Replace with your login page URL
        }, 500); // 1 second delay for user feedback before redirecting
    },

    say(message) {
        const username = localStorage.getItem('username');
        if (username && message) {
            const chatMessage = `${username}: ${message}`;
            socket.emit('chat message', chatMessage);
            term.echo(`[[;green;]You]: ${message}`);
        } else {
            term.echo('Please log in and provide a message.');
        }
    },
    


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




 
const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: true
});

//term.pause();

const username = localStorage.getItem('username');

function ready() {
    term.echo(() => {
        term.echo(() => render('Terminal Consequences'))
        .echo(`[[;white;]YOU ARE LOGGED IN] <red>${username}</red> \n`).resume();
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