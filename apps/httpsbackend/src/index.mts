import express, { Request, Response } from "express";
import cluster from "cluster";
import os from "os";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const totalcpu = os.cpus().length;
const prisma = new PrismaClient();

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
        where: { Email_Address },
      });

      if (existingUser)
        return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          Name: Name || "",
          Age: Age || 0,
          Email_Address,
          Phone_Number: Phone_Number || "",
          Nationality: Nationality || "",
          Adhaar_Number: Adhaar_Number || "",
          Contact_Name: Contact_Name || "",
          Contact_Phone: Contact_Phone || "",
          Relationship: Relationship || "",
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
        where: { Email_Address },
      });

      if (!user)
        return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid)
        return res.status(401).json({ message: "Invalid password" });

      res.status(200).json({ message: "Signin successful", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app.post("/destination",async (req:Request,res:Response)=>{
    const { id, destination } = req.body;
    try {
      await prisma.user.update({
        where: { id:id },
        data: { destination },
      });
      res.status(200).send({ message:"destination added" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
  app.get("/", (req, res) => {
    res.send(`Server running on PID ${process.pid}`);
  });

  app.listen(3030, () => {
    console.log(`Server running on http://localhost:3030 (PID: ${process.pid})`);
  });
}
