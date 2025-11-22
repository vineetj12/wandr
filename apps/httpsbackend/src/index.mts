import express, { Request, Response } from "express";
import cluster from "cluster";
import os from "os";
import bcrypt from "bcrypt";
import {prismaClient as prisma} from "@repo/database/client" 
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/commonbackend/config";
import { authenticateJWT } from "./middleware.js";
import { AuthenticatedRequest } from "./middleware.js";
const totalcpu = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Number of CPUs: ${totalcpu}`);
  console.log(`Primary process PID: ${process.pid}`);

  for (let i = 0; i < totalcpu; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);
  const app = express();
  app.use(express.json());

  app.post("/signup", async (req: Request, res: Response) => {
    try {
      const {
        Name,
        Age,
        Email_Address,
        Phone_Number,
        Nationality,
        Adhaar_Number,
        Contact_Name,
        Contact_Phone,
        Relationship,
        password,
      } = req.body;

      if (!Email_Address || !password)
        return res.status(400).json({ message: "Email and password are required" });

      const existingUser = await prisma.user.findUnique({
        where: { emailAddress:Email_Address },
      });

      if (existingUser)
        return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name: Name || "",
          age: Age || 0,
          emailAddress:Email_Address,
          phoneNumber: Phone_Number || "",
          nationality: Nationality || "",
          adhaarNumber: Adhaar_Number || "",
          contactName: Contact_Name || "",
          contactPhone: Contact_Phone || "",
          relationship: Relationship || "",
          password: hashedPassword,
        },
      });

      res.status(201).json({ message: "Signup successful", user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/signin", async (req: Request, res: Response) => {
    try {
      const { Email_Address, password } = req.body;

      if (!Email_Address || !password)
        return res.status(400).json({ message: "Email and password are required" });

      const user = await prisma.user.findUnique({
        where: { emailAddress:Email_Address },
      });

      if (!user)
        return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ message: "Invalid password" });

      const token = jwt.sign(
        { id: user.id },          
        JWT_SECRET,              
        { expiresIn: "1h" }      
      );
      res.status(200).json({ message: "Signin successful", token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
app.post("/destination", authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { destination, time, location, safe } = req.body;

  if (!destination || !time) 
    return res.status(400).json({ message: "Destination and time are required" });

  try {
    const existingLocation = await prisma.location.findUnique({
      where: { uid: userId },
    });

    if (existingLocation) {
      await prisma.location.update({
        where: { uid: userId },
        data: { destination, time },
      });
      return res.status(200).json({ message: "Destination and time updated successfully" });
    } else {
      if (!location || safe === undefined) {
        return res.status(400).json({
          message: "Missing required fields to create a new Location: location, safe",
        });
      }

      await prisma.location.create({
        data: {
          uid: userId,
          location,
          destination,
          time,
          safe,
        },
      });
      return res.status(201).json({ message: "Destination and time created successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
  app.get("/", (req, res) => {
    res.send(`Server running on PID ${process.pid}`);
  });
  
  app.listen(3030, () => {
    console.log(`Server running on http://localhost:3030 (PID: ${process.pid})`);
  });
}
