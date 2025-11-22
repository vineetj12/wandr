import { WebSocketServer } from 'ws';
import { ClientManager } from './ClientManager.js';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/commonbackend/config";

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket backend is up");

interface DecodedToken {
    id: string;
}

wss.on('connection', (ws, request) => {
    const url = request.url;
    if (!url) {
        ws.close();
        return;
    }

    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') ?? "";

    let decoded: DecodedToken;
    try {
        decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (err) {
        console.error("Invalid token", err);
        ws.close();
        return;
    }

    if (!decoded?.id) {
        ws.close();
        return;
    }

    console.log("New client connected:", decoded.id);
    const client = new ClientManager(ws,decoded.id);

    ws.on('close', () => {
        console.log('Client disconnected');
        client.close();
    });
});
