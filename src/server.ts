// src/server.ts
import 'dotenv/config'; // Loads environment variables from .env
import http from 'http';
import app from './app'; // Import your Express app

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});