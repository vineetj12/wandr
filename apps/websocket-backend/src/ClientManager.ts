import { WebSocket } from 'ws';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
interface Data {
    location: string;
    time: string;
}

export class ClientManager {
    private userid: string | null = null;
    private ws: WebSocket;
    
    constructor(ws: WebSocket) {
        this.ws = ws;
        this.ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg.toString());
                if (data.id && !this.userid) {
                    this.userid = data.id;
                    console.log(`User ID set: ${this.userid}`);
                } else {
                    this.handleMessage(data);
                }
            } catch (err) {
                console.error('Invalid JSON message received:', msg.toString());
            }
        });
        this.ws.on('close', () => {
            console.log(`Client ${this.userid ?? 'unknown'} disconnected`);
        });
    }

    private async handleMessage(data: Data) {
        console.log(`Message from ${this.userid}:`, data);
        if(this.userid){
            const result=await prisma.location.findFirst({
                where:{
                    uid:this.userid,
                },
            });
            if(result){
                if(result.location!=data.location){
                    await prisma.location.update({
                        where:{id:result.id},
                        data:{
                            location:data.location,
                            time:data.time,
                        },
                    })
                }
            }
            else{
                await prisma.location.create({
                    data:{
                        uid:this.userid,
                        location:data.location,
                        time:data.time,
                        safe:true
                    },
                })
            }
        }
    }
    private async isSafe(): Promise<boolean> {
        if (!this.userid) return true;
        const lasttime = await prisma.location.findFirst({
            where: { uid: this.userid },
            select: { time: true, safe: true },
        });
        if (!lasttime || !lasttime.time) {
            return true;
        }
        const now = new Date();
        const previous = new Date(lasttime.time);
        const diffMs = Math.abs(now.getTime() - previous.getTime());
        const diffMinutes = diffMs / (1000 * 60);
        return diffMinutes <= 10 || lasttime.safe === true;// can make ml for this
    }

    public async close() {
        if(!(await this.isSafe())){
            //send mail/call
        }
    }
}
