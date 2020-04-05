// Core modules
// http, https, fs, path, os
const http = require('http');

const routes = require('./routes');

console.log(routes.text);

// Returns a Server
const server = http.createServer(routes.handler);

// Start a process to listen for incoming requests
// Production: default is with no arguments (port 80)
server.listen(3000);