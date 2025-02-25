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
  console.log(`[AUTH] Generating token for user: ${user.username}`);
  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    process.env.SESSION_SECRET || 'secret',
    { expiresIn: '24h' }
  );
  return token;
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[AUTH] No token provided');
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, process.env.SESSION_SECRET || 'secret') as SelectUser;
    console.log(`[AUTH] Token verified for user: ${user.username}`);
    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err);
    return res.sendStatus(403);
  }
}

export function setupAuth(app: Express) {
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log(`[AUTH] Login attempt for user: ${username}`);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[AUTH] Login failed: User not found - ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (password !== user.password) {
        console.log(`[AUTH] Login failed: Invalid password - ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      console.log(`[AUTH] Login successful: ${username}`);
      res.json({ user, token });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log(`[AUTH] Register attempt for user: ${req.body.username}`);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log(`[AUTH] Register failed: Username exists - ${req.body.username}`);
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(req.body);
      const token = generateToken(user);
      console.log(`[AUTH] Register successful: ${user.username}`);
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('[AUTH] Register error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", authenticateToken, (req: Request, res: Response) => {
    console.log(`[AUTH] User info requested for: ${req.user?.username}`);
    res.json(req.user);
  });

  app.post("/api/logout", (_req: Request, res: Response) => {
    console.log('[AUTH] Logout request processed');
    res.sendStatus(200);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    console.log('[HEALTH] Health check requested');
    res.status(200).send("ok");
  });
}