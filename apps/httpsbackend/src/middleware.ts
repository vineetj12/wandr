import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JWT_SECRET } from "@repo/commonbackend/config";

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    req.user = payload; 
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Invalid token" });
  }
}
