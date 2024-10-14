/**
 * This script handles the terminal interface for the front page of the "Terminal Consequences" application, 
 * providing user interaction features such as login, registration, and general terminal commands. It sets up a jQuery Terminal 
 * instance, manages user input, and communicates with the server through API calls to enable authentication and other commands.
 * 
 * @project Terminal Consequences.
 * @author: sjurbarndon@proton.me
 */

const commands = {
    help(command_name) {
        switch(command_name) {
            case 'register':
                term.echo('Start the registration process');
              break;
            case 'login':
                term.echo(`log in with username and password, e.g. >login user password`);
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

    refresh(){
        this.exec('clear');
        ready();
    },

    register() {
        term.read('Choose a Username: ').then(username => {
            this.set_mask(true);
            term.read('Choose password: ', { echo: false }).then(password => {
                
                
                term.read('Confirm password: ', { echo: false }).then(repeat_password => { 
                    this.set_mask(false);

                    if (password === repeat_password){
                        term.echo('Creating new user...');

                        fetch('/api/register', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username, password })
                        })
                        .then(async (response) => {
                            const result = await response.json();
                            if (response.ok) {
                                term.echo('Registration successful!');
                                term.echo('You can now log in using the command: login <username> <password>');

                            } else {
                                 switch (response.status) {
                                    case 400:
                                        term.error('Error: Username or Password cannot be empty.');
                                        break;
                                    case 409:
                                        term.error('Error: Username already exists.');
                                        break;
                                    case 500:
                                        term.error('Internal server error. Please try again later.');
                                        break;
                                    default:
                                        term.error(result.error || 'Unknown error during registration.');
                                }
                            }
                        })
                        .catch(error => {
                             term.error('An unexpected error occurred: ' + error.message);
                    });
                    } else {
                        term.echo('Password mismatch.')
                    }
                });
            });
        });
    },

    login(username, password) {
        if (username && password) {
            password = String(password);
            user_login(username, password);
        } else {
            if (!username) {
                term.read('Username: ').then(inputUsername => {
                        this.set_mask(true);
                        term.read('Password: ').then(inputPassword => {
                            this.set_mask(false);
                            user_login(inputUsername, inputPassword);
                        });
                });
            } else {
                // If username is provided but password is missing, prompt for password
                this.set_mask(true);
                term.read('Password: ').then(inputPassword => {
                    this.set_mask(false);
                    user_login(username, inputPassword);
                });
            }
        }
    }
};

/**
 * Sends an api call to login the user, store the username in local storage, 
 * and redirects the user to the lobby chat.
 * 
 * @param {*} username 
 * @param {*} password 
 */
function user_login(username, password){
    term.echo('Logging in with provided credentials...');
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(result => {
        if (result.token) {
            term.echo('Login successful! Token: ' + result.token);
            localStorage.setItem('username', result.username);                
            window.location.href = 'lobby.html';
        } else {
            term.error(result.error || 'Login failed!');
        }
    })
    .catch(error => {
        term.error('An error occurred: ' + error.message);
    });
}

// Format commands as they are typed and for the help-command:
const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });
const command_list = ['clear'].concat(Object.keys(commands));
const command_formatter = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});
const commands_formatted_for_help = formatter.format(command_formatter);
const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);
const re = new RegExp(`^\s*(${command_list.join('|')})(\s?.*)`);

const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art
figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

// Set up jQuery Terminal:
const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: true,
    prompt: `tq.root > `
});

// Update the terminal formatter to handle new commands
$.terminal.new_formatter([re, function(_, command, args) {
    return `<white>${command}</white><aqua>${args}</aqua>`;
}]);

term.pause();
function ready() {
    const welcome_message = render('Terminal Consequences');
    term.echo(welcome_message);
    term.echo('[[;white;]Welcome to the manor!]\n');
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


// Logic for recording the keystrokes "login " and mask password after "login username ***":

let inputBuffer = '';
let user_pass_buffer = '';
let username_temp = '';
let login_listen = true;
let space_counter = 0;
 
term.on('keydown', function(e) {
    if (e.key === 'Enter') {
        inputBuffer = '';
        user_pass_buffer = '';
        username_temp = '';
        login_listen = true;
        password_listen = false;
        space_counter = 0;
    }
});
 
term.on('keydown', function(e) {
     if (e.key.length === 1 || e.key === ' ') {       
        if (login_listen){       
            inputBuffer += e.key;
            if (inputBuffer === 'login ') {

                login_listen = false;
                password_listen = true;

                $.terminal.new_formatter([re, function(_, command, args) {
                    const argsArray = args.trim().split(/\s+/);                 // Split arguments by spaces and trim
                    const [firstArg, secondArg, thirdArg,...rest] = argsArray;  // Destructure the arguments
            
                    if (argsArray.length < 2 ){
                        return `<white>${command}</white><aqua>${args}</aqua>`;
                    } else if(argsArray.length === 2){
                        return `<white>${command}</white> <aqua>${firstArg}</aqua> <white>${'*'.repeat(secondArg.length)}</white>`;
                    } else if(argsArray.length === 3){
                        return `<white>${command}</white> <aqua>${firstArg}</aqua> <white>${'*'.repeat(secondArg.length)}</white> <yellow>${thirdArg}</yellow>`;
                    } else { 
                        let formattedArgs = '';
                        if (firstArg) {
                            formattedArgs += `<aqua>${firstArg}</aqua> `;
                        }
                        if (secondArg) {
                            formattedArgs += `<white>${'*'.repeat(secondArg.length)}</white> `
                        }
                        if (thirdArg) {
                            formattedArgs += `<yellow>${thirdArg}</yellow> `;
                        }
                        if (rest.length > 0) {
                             formattedArgs += (formattedArgs ? ' ' : '') + `<yellow>${rest.join(' ')}</yellow>`; // Add space only if previous arguments exist
                        }
                    
                        return `<white>${command}</white> ${formattedArgs}`;
                    }
                }]); 
            }  
        }
    } else if (e.key === 'Backspace') {
        inputBuffer = inputBuffer.slice(0, -1);
    }
});