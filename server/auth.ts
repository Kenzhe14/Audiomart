import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

function generateToken(user: SelectUser) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    process.env.SESSION_SECRET || 'secret',
    { expiresIn: '24h' }
  );
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, process.env.SESSION_SECRET || 'secret') as SelectUser;
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

export function setupAuth(app: Express) {
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', username);

      const user = await storage.getUserByUsername(username);
      if (!user || password !== user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(req.body);
      const token = generateToken(user);
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", authenticateToken, (req: Request, res: Response) => {
    res.json(req.user);
  });

  app.post("/api/logout", (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).send("ok");
  });
}