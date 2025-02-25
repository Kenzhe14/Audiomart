import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Базовое логирование для отладки
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Обработка ошибок
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
});

(async () => {
  try {
    console.log('Starting server initialization...');
    const server = await registerRoutes(app);

    if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static serving for production...');
      serveStatic(app);
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      console.log(`Server started successfully on port ${port}`);
      console.log(`Environment: ${app.get("env")}`);
      console.log('Ready to accept connections');
    });
  } catch (error) {
    console.error('Fatal server error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
})();