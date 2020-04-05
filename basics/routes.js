const fs = require('fs');

const requestHandler = (req, res) => {
    const url = req.url;
    const method = req.method;

    if (url === '/') {
        res.write('<html>');
        res.write('<head><title>Enter message</title></head>');
    
        // name="message" attr on input will be the key of the value typed in the input
        res.write('<body><form action="/message" method="POST"><input type="text" name="message"><button type="submit">Send</button></form></body>');
        return res.write('</html>');
    }
    
    if (url === '/message' && method === 'POST') {
        const body = [];
        
        req.on('data', (chunk) => {
            // console.log(chunk);
            body.push(chunk);
        });
    
        // add a return to prevent the error of setting a header after res.end()
        // this is to make the code after this if statement not execute
        return req.on('end', () => {
            // add all the chunks from body array
            const parsedBody = Buffer.concat(body).toString();
    
            // console.log(parsedBody);
            const message = parsedBody.split('=')[1];
            fs.writeFile('message.txt', message, (err) => {
                // err is null if everything is okay
                // when message is parsed, redirect to '/'
                res.statusCode = 302;
                res.setHeader('Location', '/');
                return res.end();
            });
    
            /*
                If these 3 lines are inside the 'end' listener,
                then this code is NOT executed when /message is visited,
                because we're just registering an event listener.
                Also, it executes after the request is ended, and that happens
                just after the code located after this if statement and we receive an
                error on the line res.setHeader('Location', '/'); because we've
                already set res.setHeader('Content-Type', 'text/html'); and did res.end()
                and we cannot set a header after res.end()
            */
            // 302 = status code for redirection
            // res.statusCode = 302;
            // res.setHeader('Location', '/');
            // return res.end();
        });
     
        /*
            If these 3 lines are outside the 'end' listener,
            then this code is executed when /message is visited.
            Therefore, after sending something in the input form,
            we are automatically redirected to '/' to fill another input.
        */
    
        // 302 = status code for redirection
        // res.statusCode = 302;
        // res.setHeader('Location', '/');
        // return res.end();
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<head><title>My first page</title></head>');
    res.write('<body>Hello</body>');
    res.write('</html>');
    res.end();
};

// module.exports.handler = requestHandler;
// module.exports.text = 'some exported text';

module.exports = {
    handler: requestHandler,
    text: 'some exported text'
};
