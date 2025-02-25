import pg from 'pg'; // ⬅️ Импортируем весь модуль
import { drizzle } from 'drizzle-orm/node-postgres';
import { Express, Request, Response } from "express";
import { storage } from "./storage"
import * as schema from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg; // ⬅️ Достаём Pool после импорта

function checkDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error("Ошибка: DATABASE_URL не задан!");
    process.exit(1);
  }
}

console.log('Initializing database connection...');
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
checkDatabaseUrl();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 10,
  idleTimeoutMillis: 30000,
  keepAlive: true
});

pool.on('error', (err) => {
  console.error('Ошибка подключения к базе данных:', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('✅ Успешное подключение к базе данных');
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Тест подключения успешен');
    client.release();
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
    process.exit(1);
  }
}

const db = drizzle(pool, { schema });

testConnection();

export { pool, db };
