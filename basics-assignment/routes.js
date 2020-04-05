const requestHandler = (req, res) => {
    const url = req.url;
    const method = req.method;

    // Default route
    if (url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.write('<html>');
        res.write('<head><title>Home</title></head>');
        res.write('<body><form action="/create-user" method="POST"><input type="text" name="username"><button type="submit">Register</button></form></body>');
        res.write('</html>');
        res.end();
    }

    // users route
    if (url === '/users') {
        res.setHeader('Content-Type', 'text/html');
        res.write('<html>');
        res.write('<head><title>Users</title></head>');
        res.write('<body><ul><li>User 1</li><li>User 2</li></ul></body>');
        res.write('</html>');
        return res.end();
    }

    // create-user route
    if (url === '/create-user') {
        const body = [];

        req.on('data', chunk => {
            body.push(chunk);
        });

        req.on('end', () => {
            const parsedBody = Buffer.concat(body).toString();
            // console.log(parsedBody);
            const message = parsedBody.split('=')[1];
            console.log(message);
        });

        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
    }
};

module.exports = requestHandler;
