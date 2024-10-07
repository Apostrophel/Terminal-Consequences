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


    //registration and log in functions
    register() {
        term.read('Choose a Username: ').then(username => {
            term.read('Choose password: ', { echo: false }).then(password => {
                // Now you have both username and password
                term.echo('Creating new user...');

                // Make the API call to register
                fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                })
                .then(async (response) => {
                    // First capture the response and parse the JSON body
                    const result = await response.json();

                    // Now handle the result based on response status
                    if (response.ok) {
                        term.echo('Registration successful!');
                    } else {
                        // Display detailed error message based on status code
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
                    // Handle unexpected errors
                    term.error('An unexpected error occurred: ' + error.message);
                });

            });
        });
    },

    login(username, password) {
        if (username && password) {
            password = String(password);
            // If both username and password are provided, use them directly
            term.echo('Logging in with provided credentials...');
    
            // Make the API call to login
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
                    
                    // Store the username in localStorage
                    localStorage.setItem('username', result.username);
                
                    // Redirect to the lobby
                    window.location.href = 'lobby.html';
                } else {
                    term.error(result.error || 'Login failed!');
                }
            })
            .catch(error => {
                term.error('An error occurred: ' + error.message);
            });
        } else {
            // If any parameter is missing, prompt for the username and/or password
            if (!username) {
                term.read('Username: ').then(inputUsername => {
                    if (!password) {
                        term.read('Password: ', { echo: false }).then(inputPassword => {
                            term.echo('Logging in...');
    
                            // Make the API call to login
                            fetch('/api/login', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ username: inputUsername, password: inputPassword })
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.token) {
                                    term.echo('Login successful! Token: ' + result.token);
                                    
                                    // Store the username in localStorage
                                    localStorage.setItem('username', result.username);
                                
                                    // Redirect to the lobby
                                    window.location.href = 'lobby.html';
                                } else {
                                    term.error(result.error || 'Login failed!');
                                }
                            })
                            .catch(error => {
                                term.error('An error occurred: ' + error.message);
                            });
                        });
                    } else {
                        term.echo('Logging in with provided username and password...');
    
                        // Make the API call to login
                        fetch('/api/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: inputUsername, password })
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.token) {
                                term.echo('Login successful! Token: ' + result.token);
                                
                                // Store the username in localStorage
                                localStorage.setItem('username', result.username);
                            
                                // Redirect to the lobby
                                window.location.href = 'lobby.html';
                            } else {
                                term.error(result.error || 'Login failed!');
                            }
                        })
                        .catch(error => {
                            term.error('An error occurred: ' + error.message);
                        });
                    }
                });
            } else {
                // If username is provided but password is missing, prompt for password
                term.read('Password: ', { echo: false }).then(inputPassword => {
                    term.echo('Logging in...');
    
                    // Make the API call to login
                    fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username, password: inputPassword })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.token) {
                            term.echo('Login successful! Token: ' + result.token);
                            
                            // Store the username in localStorage
                            localStorage.setItem('username', result.username);
                        
                            // Redirect to the lobby
                            window.location.href = 'lobby.html';
                        } else {
                            term.error(result.error || 'Login failed!');
                        }
                    })
                    .catch(error => {
                        term.error('An error occurred: ' + error.message);
                    });
                });
            }
        }
    }

    
};

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

function ready() {
    term.echo(() => {
        term.echo(() => render('Terminal Consequences'))
        .echo('[[;white;]Welcome to the manor!]\n').resume();
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