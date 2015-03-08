var Server = require(__dirname+"/index.js");
// If called with `start`, we automatically start a server
var argv = require('minimist')(process.argv.slice(2));
options = {};
for(var key in argv) {
    switch(key) {
        case "o":
            options['driver-port'] = parseInt(argv[key], 10)+28015
            break;
        case "port-offset":
            options['driver-port'] = parseInt(argv[key], 10)+28015
            break;
        default:
            options[key] = argv[key];
    }
}
var server = new Server(options);

