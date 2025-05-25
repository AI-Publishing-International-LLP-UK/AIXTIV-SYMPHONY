// Simple Node.js HTTP server
const http = require('http');

// Define the port to listen on
const PORT = 3000;

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set the response HTTP header with HTTP status and Content-Type
  res.writeHead(200, {'Content-Type': 'text/plain'});
  
  // Check if the request is for the root path
  if (req.url === '/') {
    // Send "Hello World" as the response body for root path
    res.end('Hello World\n');
  } else {
    // For any other path, return a 404 message
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 Not Found\n');
  }
});

// Start the server and listen on the specified port
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});

