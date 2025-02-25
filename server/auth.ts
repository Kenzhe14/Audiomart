import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: SelectUser) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    process.env.SESSION_SECRET!,
    { expiresIn: '24h' }
  );
}

async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const user = jwt.verify(token, process.env.SESSION_SECRET!) as SelectUser;
    req.user = user;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

export function setupAuth(app: Express) {
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log('Register attempt:', req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Register failed: Username exists -', req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      const token = generateToken(user);
      console.log('Register success:', user.username);
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt:', username);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('Login failed: User not found -', username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Проверяем пароль для админа
      if (username === 'admin') {
        console.log('Admin login attempt');
        if (password === 'admin123') {
          console.log('Admin login successful with default password');
          const token = generateToken(user);
          return res.json({ user, token });
        }
      }

      // Для обычных пользователей проверяем хешированный пароль
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        console.log('Login failed: Invalid password -', username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);
      console.log('Login success:', username);
      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", authenticateToken, (req: Request, res: Response) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    res.sendStatus(200);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).send("ok");
  });
}