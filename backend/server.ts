import dotenv from "dotenv";
dotenv.config();

import http from "node:http";
import app from "./src/app.js";
import { initSocket } from "./src/socket/socket.js";

const server = http.createServer(app);

// Initialize Socket.io on the HTTP server
initSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server and Socket.io running on http://localhost:${PORT}`);
});
