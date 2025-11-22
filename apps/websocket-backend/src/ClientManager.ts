// ClientManager.ts
import { WebSocket } from "ws";
import axios from "axios";
import {prismaClient as prisma} from "@repo/database/client"

interface Data {
  location: string;
  time: string;
}

interface RouteResult {
  path: string[];
  totalCost: number;
  scores: Record<string, number>;
}
const graph: Record<string, string[]> = {
  Alipur: ["Narela", "Bawana", "Burari", "Swaroop Nagar"],
  Narela: ["Alipur", "Bawana", "Holambi Kalan"],
  Bawana: ["Alipur", "Narela", "Rohini"],
  "Holambi Kalan": ["Narela", "Burari"],
  "Swaroop Nagar": ["Alipur", "Burari"],
  Burari: ["Alipur", "Swaroop Nagar", "Wazirabad", "Mukherjee Nagar"],
  Wazirabad: ["Burari", "Timarpur"],
  Timarpur: ["Wazirabad", "Civil Lines"],
  "Civil Lines": ["Timarpur", "Kashmiri Gate", "GTB Nagar"],
  "GTB Nagar": ["Mukherjee Nagar", "Model Town", "Civil Lines"],
  "Mukherjee Nagar": ["Burari", "GTB Nagar", "Kamla Nagar"],
  "Model Town": ["Azadpur", "GTB Nagar", "Shalimar Bagh"],
  Azadpur: ["Model Town", "Adarsh Nagar", "Shalimar Bagh"],
  "Adarsh Nagar": ["Azadpur", "Shalimar Bagh"],
  "Shalimar Bagh": ["Azadpur", "Rohini", "Pitampura"],
  Rohini: ["Bawana", "Pitampura", "Mangolpuri"],
  Pitampura: ["Rohini", "Shalimar Bagh", "Punjabi Bagh"],
  Mangolpuri: ["Rohini", "Peeragarhi"],
  Peeragarhi: ["Mangolpuri", "Paschim Vihar"],
  "Paschim Vihar": ["Peeragarhi", "Punjabi Bagh"],
  "Punjabi Bagh": ["Paschim Vihar", "Rajouri Garden", "Ashok Vihar"],
  "Rajouri Garden": ["Punjabi Bagh", "Tagore Garden", "Tilak Nagar"],
  "Tagore Garden": ["Rajouri Garden", "Tilak Nagar"],
  "Tilak Nagar": ["Tagore Garden", "Janakpuri"],
  Janakpuri: ["Tilak Nagar", "Uttam Nagar", "Dwarka"],
  "Uttam Nagar": ["Janakpuri", "Dwarka"],
  Dwarka: ["Uttam Nagar", "Najafgarh", "IGI Airport"],
  Najafgarh: ["Dwarka", "Nangloi"],
  Nangloi: ["Najafgarh", "Punjabi Bagh"],
  "Kashmiri Gate": ["Civil Lines", "Old Delhi"],
  "Old Delhi": ["Kashmiri Gate", "Chandni Chowk"],
  "Chandni Chowk": ["Old Delhi", "Daryaganj"],
  Daryaganj: ["Chandni Chowk", "Paharganj", "ITO"],
  Paharganj: ["Daryaganj", "Karol Bagh", "Connaught Place"],
  "Karol Bagh": ["Paharganj", "Patel Nagar"],
  "Patel Nagar": ["Karol Bagh", "Rajendra Nagar"],
  "Rajendra Nagar": ["Patel Nagar", "Connaught Place"],
  "Connaught Place": ["Rajendra Nagar", "Mandi House", "Janpath"],
  "Mandi House": ["Connaught Place", "ITO"],
  ITO: ["Daryaganj", "Mandi House", "Lajpat Nagar"],
  "Lajpat Nagar": ["ITO", "East of Kailash", "Kailash Colony"],
  "East of Kailash": ["Lajpat Nagar", "Nehru Place"],
  "Kailash Colony": ["Lajpat Nagar", "Greater Kailash"],
  "Greater Kailash": ["Kailash Colony", "Chirag Delhi"],
  "Chirag Delhi": ["Greater Kailash", "Hauz Khas"],
  "Hauz Khas": ["Chirag Delhi", "Green Park", "SDA"],
  "Green Park": ["Hauz Khas", "AIIMS"],
  AIIMS: ["Green Park", "Safdarjung Enclave"],
  "Safdarjung Enclave": ["AIIMS", "RK Puram"],
  "RK Puram": ["Safdarjung Enclave", "Vasant Vihar"],
  "Vasant Vihar": ["RK Puram", "Vasant Kunj"],
  "Vasant Kunj": ["Vasant Vihar", "Mehrauli", "Mahipalpur"],
  Mehrauli: ["Vasant Kunj", "Saket"],
  Saket: ["Mehrauli", "Malviya Nagar"],
  "Malviya Nagar": ["Saket", "Hauz Khas"],
  SDA: ["Hauz Khas", "AIIMS"],
  Mahipalpur: ["Vasant Kunj", "Aerocity"],
  Aerocity: ["Mahipalpur", "IGI Airport"],
  "IGI Airport": ["Aerocity", "Dwarka"],
  "Laxmi Nagar": ["Preet Vihar", "Nirman Vihar"],
  "Preet Vihar": ["Laxmi Nagar", "Anand Vihar"],
  "Anand Vihar": ["Preet Vihar", "Karkardooma"],
  Karkardooma: ["Anand Vihar", "Vivek Vihar"],
  "Vivek Vihar": ["Karkardooma", "Shahdara"],
  Shahdara: ["Vivek Vihar", "Seemapuri"],
  Seemapuri: ["Shahdara", "Dilshad Garden"],
  "Dilshad Garden": ["Seemapuri", "Jhilmil"],
  "Yamuna Vihar": ["Seelampur", "Bhajanpura"],
  Bhajanpura: ["Yamuna Vihar", "Gokulpuri"],
  Seelampur: ["Yamuna Vihar", "Welcome"],
  Welcome: ["Seelampur", "Shahdara"],
};
export class ClientManager {
  private userid: string; 
  private ws: WebSocket;

  constructor(ws: WebSocket, userid: string) {
    this.ws = ws;
    this.userid = userid;

    this.ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString()) as Data;
        this.handleMessage(data).catch((err) =>
          console.error("handleMessage error:", err)
        );
      } catch (err) {
        console.error("Invalid JSON message received:", msg.toString());
      }
    });

    this.ws.on("close", () => {
      console.log(`Client ${this.userid} disconnected`);
      this.close().catch(console.error);
    });
  }

  // ------------------------ handleMessage ------------------------
  private async handleMessage(data: Data) {
    console.log(`Message from ${this.userid}:`, data);

    if (!data.location || !data.time) {
      console.warn("Invalid data received, ignoring.");
      return;
    }

    // 1) Save/update user's last location in DB
    const lastLoc = await prisma.location.findFirst({
      where: { uid: this.userid },
    });

    if (lastLoc) {
      const updateData: any = { time: data.time };
      if (lastLoc.location !== data.location) updateData.location = data.location;
      await prisma.location.update({
        where: { id: lastLoc.id },
        data: updateData,
      });
    } else {
      await prisma.location.create({
        data: {
          uid: this.userid,
          location: data.location,
          time: data.time,
          safe: true,
        },
      });
    }

    // 2) Get user's destination from DB
    const user = await prisma.location.findFirst({
      where: { id: this.userid },
      select: { destination: true },
    });

    const destination = user?.destination;
    if (!destination) {
      console.log("No destination set for user:", this.userid);
      this.ws.send(JSON.stringify({ error: "No destination set for user" }));
      return;
    }

    // 3) Compute route
    const routeResult = await this.route(data.location, destination);

    // 4) Send route back to client
    this.ws.send(JSON.stringify(routeResult));
    console.log("Route sent to client:", routeResult);
  }

  // ------------------------ route ------------------------
private async route(currentLocation: string,destination: string): Promise<string[]> {
    let safetyMap: Record<string, number> = {};

  // 1) Try fetching from API
  try {
    const resp = await axios.get("http://localhost/safty", { timeout: 5000 });
    if (resp && resp.data) {
      if (typeof resp.data === "object" && "safetyScores" in resp.data) {
        safetyMap = { ...resp.data.safetyScores };
      } else if (typeof resp.data === "object") {
        safetyMap = { ...resp.data };
      }
    }
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.warn("API failed, using random scores:", err.message);
  } else {
    console.warn("API failed, using random scores:", err);
  }
}
  // 2) Fill missing or all scores with random values
  for (const loc of Object.keys(graph)) {
    if (!safetyMap[loc]) safetyMap[loc] = Math.floor(Math.random() * 10) + 1;
  }

  // 3) Dijkstra-like routing based on safety
  const nodes = Object.keys(graph);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  const scoreToCost = (score: number) => 10 - score; // higher score = safer

  for (const n of nodes) {
    dist[n] = Infinity;
    prev[n] = null;
  }
  dist[currentLocation] = 0;

  while (visited.size < nodes.length) {
    let u: string | null = null;
    for (const n of nodes) {
      if (!visited.has(n) && (u === null || dist[n] < dist[u])) u = n;
    }
    if (!u || dist[u] === Infinity) break;
    if (u === destination) break;

    visited.add(u);
    for (const v of graph[u]) {
      const alt = dist[u] + scoreToCost(safetyMap[v]);
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  // 4) Reconstruct path
  const path: string[] = [];
  let cur: string | null = destination;
  if (!isFinite(dist[destination])) return []; // unreachable
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }

  return path;
}

  // ------------------------ isSafe ------------------------
  private async isSafe(): Promise<boolean> {
    const lasttime = await prisma.location.findFirst({
      where: { uid: this.userid },
      select: { time: true, safe: true },
    });

    if (!lasttime?.time) return true;

    const now = new Date();
    const previous = new Date(lasttime.time);
    const diffMinutes = Math.abs(now.getTime() - previous.getTime()) / (1000 * 60);
    return diffMinutes <= 10 || lasttime.safe === true;
  }

  // ------------------------ close ------------------------
  public async close() {
    if (!(await this.isSafe())) {
      console.log("User not safe: trigger alert");
    }
  }
}
