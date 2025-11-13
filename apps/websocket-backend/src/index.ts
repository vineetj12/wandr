import { WebSocketServer } from 'ws';
import { ClientManager } from './ClientManager.js';
const wss=new WebSocketServer({ port:8080 });
console.log("websocket backend is up");

wss.on('connection',(ws)=>{
    console.log("new client connected");
    const client=new ClientManager(ws);
    ws.on('close',()=>{
        console.log('client disconnected')
        client.close();
    });    
})