import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

console.log('Initializing database connection...');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 10, // Максимальное количество соединений в пуле
  idleTimeoutMillis: 30000, // Время ожидания неактивного соединения
  keepAlive: true // Поддерживать соединение активным
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('New client connected to the pool');
});

const db = drizzle(pool, { schema });

console.log('Database connection initialized successfully');

export { pool, db };