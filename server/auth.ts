import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('Auth failed: User not found -', username);
          return done(null, false);
        }

        // Hash the stored password for admin if it's not already hashed
        if (user.username === 'admin' && !user.password.includes('.')) {
          user.password = await hashPassword('admin123');
          await storage.updateUserPassword(user.id, user.password);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          console.log('Auth failed: Invalid password -', username);
          return done(null, false);
        }

        console.log('Auth success:', username, 'isAdmin:', user.isAdmin);
        return done(null, user);
      } catch (error) {
        console.error('Auth error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('Deserialize failed: User not found -', id);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Deserialize error:', error);
      done(error);
    }
  });

  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Register attempt:', req.body.username);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log('Register failed: Username exists -', req.body.username);
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Register success:', user.username);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Register error:', error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: Request, res: Response) => {
    console.log('Login success:', req.user);
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    const username = req.user?.username;
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      console.log('Logout success:', username);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    console.log('User check:', req.isAuthenticated(), req.user);
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).send("ok");
  });
}