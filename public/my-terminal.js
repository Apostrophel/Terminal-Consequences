const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });
  

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


    //registration and log in functions
    register() {
        term.read('Choose a Username: ').then(username => {
            this.set_mask(true);
            term.read('Choose password: ', { echo: false }).then(password => {
                
                
                term.read('Confirm password: ', { echo: false }).then(repeat_password => { 
                    this.set_mask(false);

                    if (password === repeat_password){
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
                                term.echo('You can now log in using the command: login <username> <password>');

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

                    } else {
                        term.echo('Password mismatch.')
                    }
                     
                // Now you have both username and password


                    
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
            if (!username) {
                term.read('Username: ').then(inputUsername => {
                        this.set_mask(true);
                        term.read('Password: ').then(inputPassword => {
                            this.set_mask(false);
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
                    
                });
            } else {
                // If username is provided but password is missing, prompt for password
                this.set_mask(true);
                term.read('Password: ').then(inputPassword => {
                    this.set_mask(false);
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

const font = 'Bloody';  // https://patorjk.com/software/taag/#p=display&f=Bloody&t=Terminal%20Consequences <-- for more fonts ascii art

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts/' });
figlet.preloadFonts([font], ready);

const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    completion: true,
    prompt: `tq.root > `
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




//logic for recording the keystrokes "login " and mask password after "login username ***":

let inputBuffer = '';  // To store the user input
let user_pass_buffer = '';
let username_temp = '';
let login_listen = true;
let space_counter = 0;
let temp_password = '';

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
    // console.log(`inputBuffer: ${inputBuffer}`)
    // console.log(`user_pass_buffer, ${user_pass_buffer}`)
    // console.log(`username_temp: ${username_temp}`)
    // console.log(`temp_password, ${temp_password}`)
    // console.log(`space_counter: ${space_counter}`)

    // Check if the key pressed is a printable character or space
    if (e.key.length === 1 || e.key === ' ') {       
        if (login_listen){       
            inputBuffer += e.key;  // Accumulate input
            if (inputBuffer === 'login ') {

                login_listen = false;
                password_listen = true;

                $.terminal.new_formatter([re, function(_, command, args) {
                    const argsArray = args.trim().split(/\s+/); // Split arguments by spaces and trim
                    const [firstArg, secondArg, thirdArg,...rest] = argsArray; // Destructure the arguments
            
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
                            formattedArgs += `<yellow>${thirdArg}</yellow> `; // Add space only if there's a first argument
                        }
                        if (rest.length > 0) {
                            //formattedArgs += ` <yellow>${rest.join(' ')}</yellow>`; // Any remaining arguments in yellow
                            formattedArgs += (formattedArgs ? ' ' : '') + `<yellow>${rest.join(' ')}</yellow>`; // Add space only if previous arguments exist
                        }
                    
                        return `<white>${command}</white> ${formattedArgs}`;
                    }
                }]); 

            }  
        }

    } else if (e.key === 'Backspace') {
        // Handle backspace to remove last character
        inputBuffer = inputBuffer.slice(0, -1);
        
    }
});