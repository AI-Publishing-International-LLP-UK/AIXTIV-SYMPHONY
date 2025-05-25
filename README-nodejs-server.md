# Simple Node.js HTTP Server

This is a basic HTTP server built with Node.js that responds with "Hello World" when accessed at the root path.

## Prerequisites

Before running the server, make sure you have Node.js installed on your system. You can check by running:

```bash
node --version
```

If Node.js is not installed, download and install it from [nodejs.org](https://nodejs.org/).

## Running the Server

Follow these steps to run the server:

1. Navigate to the directory containing `server.js`:

```bash
cd /Users/as/asoos
```

2. Run the server using Node.js:

```bash
node server.js
```

3. You should see the following output:

```
Server running at http://localhost:3000/
Press Ctrl+C to stop the server
```

4. Open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

   You should see "Hello World" displayed in your browser.

5. To stop the server, press `Ctrl+C` in the terminal where the server is running.

## Testing with cURL

You can also test the server using cURL:

```bash
curl http://localhost:3000
```

This should return "Hello World".

## Modifying the Server

If you want to change the port, edit the `PORT` constant in `server.js`.

If you want to add more routes or functionality, you can modify the request handler function in `server.js`.

## Integration with Aixtiv Symphony

To integrate this server with other Aixtiv Symphony components, you may need to:

1. Add authentication middleware
2. Connect to the appropriate databases
3. Set up proper routing to handle API requests

Refer to the Aixtiv Symphony architecture documentation for more details on integration patterns.

