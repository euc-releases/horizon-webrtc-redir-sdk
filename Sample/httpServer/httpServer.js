const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Use the specified port or default to 3000

// Define the directory to serve static files from (e.g., "public" directory)
const publicDirectory = path.join(__dirname);

// Serve static files from the public directory
app.use(express.static(publicDirectory));

// Configure HTTPS options
const httpsOptions = {
  key: fs.readFileSync("../certs/key.pem", "utf8"),
  cert: fs.readFileSync("../certs/cert.pem", "utf8"),
};

// Create an HTTPS 
const server = https.createServer(httpsOptions, app);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
