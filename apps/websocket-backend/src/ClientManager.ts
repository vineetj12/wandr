// ClientManager.ts
import { WebSocket } from "ws";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Data {
  location: string;
  time: string;
}

interface RouteResult {
  path: string[];
  totalCost: number;
  scores: Record<string, number>;
}

export class ClientManager {
  private userid: string | null = null;
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;

    this.ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        // first message can be { id: "..." } to set user id
        if (data?.id && !this.userid) {
          this.userid = data.id;
          console.log(`User ID set: ${this.userid}`);
        } else {
          // otherwise expect a Data object { location, time }
          this.handleMessage(data as Data).catch((err) =>
            console.error("handleMessage error:", err)
          );
        }
      } catch (err) {
        console.error("Invalid JSON message received:", msg.toString());
      }
    });

    this.ws.on("close", () => {
      console.log(`Client ${this.userid ?? "unknown"} disconnected`);
    });
  }

  // ------------------------ handleMessage ------------------------
  private async handleMessage(data: Data) {
    console.log(`Message from ${this.userid}:`, data);

    if (!this.userid) {
      console.warn("No userid set for this socket. Ignoring location update.");
      return;
    }

    // 1) Save/update user's last location in DB
    const lastLoc = await prisma.location.findFirst({
      where: { uid: this.userid },
    });

    if (lastLoc) {
      if (lastLoc.location !== data.location) {
        await prisma.location.update({
          where: { id: lastLoc.id },
          data: { location: data.location, time: data.time },
        });
      } else {
        // update time even if same location
        await prisma.location.update({
          where: { id: lastLoc.id },
          data: { time: data.time },
        });
      }
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
    const user = await prisma.user.findFirst({
      where: { id: this.userid },
      select: { destination: true },
    });

    const destination = user?.destination;
    if (!destination) {
      console.log("No destination set for user:", this.userid);
      // Optionally notify client
      this.ws.send(JSON.stringify({ error: "No destination set for user" }));
      return;
    }

    // 3) Compute route
    const routeResult = await this.route(data.location, destination);

    // 4) Send route back to client (Option C format)
    this.ws.send(JSON.stringify(routeResult));
    console.log("Route sent to client:", routeResult);
  }

  // ------------------------ route (Dijkstra using safety) ------------------------
  private async route(currentLocation: string, destination: string): Promise<RouteResult> {
    try {
      // 1) Fetch safety scores from API
      // Expecting: { "Alipur": 7, "Narela": 6, ... } OR { "safetyScores": { ... } }
      const resp = await axios.get("http://localhost/safty", { timeout: 5000 });
      let safetyMap: Record<string, number> = {};

      if (!resp || !resp.data) {
        throw new Error("Invalid response from safety API");
      }

      // Support two possible response shapes
      if (typeof resp.data === "object" && "safetyScores" in resp.data && typeof resp.data.safetyScores === "object") {
        safetyMap = resp.data.safetyScores as Record<string, number>;
      } else {
        safetyMap = resp.data as Record<string, number>;
      }

      // 2) Full Delhi adjacency graph (localities -> neighbors)
      // NOTE: expand as needed; this is a reasonably large sample
      const graph: Record<string, string[]> = {
        // North
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

        // North-West
        "Shalimar Bagh": ["Azadpur", "Rohini", "Pitampura"],
        Rohini: ["Bawana", "Pitampura", "Mangolpuri"],
        Pitampura: ["Rohini", "Shalimar Bagh", "Punjabi Bagh"],
        Mangolpuri: ["Rohini", "Peeragarhi"],
        Peeragarhi: ["Mangolpuri", "Paschim Vihar"],

        // West
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

        // Central
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

        // South
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

        // Airport area
        Mahipalpur: ["Vasant Kunj", "Aerocity"],
        Aerocity: ["Mahipalpur", "IGI Airport"],
        "IGI Airport": ["Aerocity", "Dwarka"],

        // East
        "Laxmi Nagar": ["Preet Vihar", "Nirman Vihar"],
        "Preet Vihar": ["Laxmi Nagar", "Anand Vihar"],
        "Anand Vihar": ["Preet Vihar", "Karkardooma"],
        "Karkardooma": ["Anand Vihar", "Vivek Vihar"],
        "Vivek Vihar": ["Karkardooma", "Shahdara"],
        Shahdara: ["Vivek Vihar", "Seemapuri"],
        Seemapuri: ["Shahdara", "Dilshad Garden"],
        "Dilshad Garden": ["Seemapuri", "Jhilmil"],

        // North-East
        "Yamuna Vihar": ["Seelampur", "Bhajanpura"],
        Bhajanpura: ["Yamuna Vihar", "Gokulpuri"],
        Seelampur: ["Yamuna Vihar", "Welcome"],
        Welcome: ["Seelampur", "Shahdara"],
      };

      // 3) ensure nodes exist in graph. if missing, add as isolated node
      const ensureNode = (n: string) => {
        if (!(n in graph)) graph[n] = [];
      };
      ensureNode(currentLocation);
      ensureNode(destination);
      for (const k of Object.keys(safetyMap)) ensureNode(k);

      // 4) Convert safety score to cost (lower cost = safer)
      // If a location lacks a score, we use default cost = 9 (very unsafe)
      const scoreToCost = (score?: number) => {
        if (typeof score === "number" && !isNaN(score)) return 10 - score;
        return 9; // default worst-case cost
      };

      // 5) Dijkstra (array-based) - graph nodes are localities (strings)
      const nodes = Object.keys(graph);
      const dist: Record<string, number> = {};
      const prev: Record<string, string | null> = {};

      for (const n of nodes) {
        dist[n] = Infinity;
        prev[n] = null;
      }
      dist[currentLocation] = 0;

      const visited = new Set<string>();

      while (visited.size < nodes.length) {
        // pick the unvisited node with smallest dist
        let u: string | null = null;
        for (const n of nodes) {
          if (!visited.has(n) && (u === null || dist[n] < dist[u])) u = n;
        }
        if (u === null) break;
        if (dist[u] === Infinity) break; // remaining nodes unreachable
        if (u === destination) break;

        visited.add(u);

        const neighbors = graph[u] || [];
        for (const v of neighbors) {
          // cost to enter neighbor v is based on its safety score
          const alt = dist[u] + scoreToCost(safetyMap[v]);
          if (alt < dist[v]) {
            dist[v] = alt;
            prev[v] = u;
          }
        }
      }

      // reconstruct path
      const path: string[] = [];
      let cur: string | null = destination;
      // if destination unreachable (dist infinity), return empty path
      if (!isFinite(dist[destination])) {
        return {
          path: [],
          totalCost: Infinity,
          scores: safetyMap,
        };
      }

      while (cur) {
        path.unshift(cur);
        cur = prev[cur];
      }

      // 6) Build result (Option C)
      const totalCost = dist[destination];
      return {
        path,
        totalCost,
        scores: safetyMap,
      };
    } catch (err) {
      console.error("Error computing route:", err);
      // On error, return minimal response
      return {
        path: [],
        totalCost: Infinity,
        scores: {},
      };
    }
  }

  // ------------------------ isSafe ------------------------
  private async isSafe(): Promise<boolean> {
    if (!this.userid) return true;
    const lasttime = await prisma.location.findFirst({
      where: { uid: this.userid },
      select: { time: true, safe: true },
    });

    if (!lasttime || !lasttime.time) return true;

    const now = new Date();
    const previous = new Date(lasttime.time);
    const diffMs = Math.abs(now.getTime() - previous.getTime());
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= 10 || lasttime.safe === true;
  }

  // ------------------------ close ------------------------
  public async close() {
    if (!(await this.isSafe())) {
      // send mail/call or push notification
      console.log("User not safe: trigger alert");
    }
  }
}
