import { Express, Request, Response } from "express";
import { storage } from "./storage";
import jwt from "jsonwebtoken";

export function setupAuth(app: Express) {
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      const token = jwt.sign(
          { id: user.id, username: user.username, isAdmin: user.isAdmin },
          process.env.SESSION_SECRET || 'secret',
          { expiresIn: '24h' }
      );

      res.json({ user, token });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь уже существует" });
      }

      const user = await storage.createUser(req.body);
      const token = jwt.sign(
          { id: user.id, username: user.username, isAdmin: user.isAdmin },
          process.env.SESSION_SECRET || 'secret',
          { expiresIn: '24h' }
      );

      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  });

  app.get("/api/user", (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }

    try {
      const user = jwt.verify(token, process.env.SESSION_SECRET || 'secret');
      res.json(user);
    } catch (err) {
      res.status(401).json({ message: "Недействительный токен" });
    }
  });

  app.post("/api/logout", (_req: Request, res: Response) => {
    res.sendStatus(200);
  });
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).send("ok");
  });
}