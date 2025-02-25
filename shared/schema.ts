import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false)
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description")
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  description: text("description")
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  brandId: integer("brand_id").notNull(),
  stock: integer("stock").notNull().default(0)
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertBrandSchema = createInsertSchema(brands);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;

// Предустановленные категории аудиотехники
export const DEFAULT_CATEGORIES = [
  { name: "Наушники", subcategories: [
    "Беспроводные наушники",
    "Проводные наушники",
    "Спортивные наушники",
    "Профессиональные наушники"
  ]},
  { name: "Колонки", subcategories: [
    "Портативные колонки",
    "Домашние колонки",
    "Профессиональные колонки",
    "Умные колонки"
  ]},
  { name: "Усилители", subcategories: [
    "Предусилители",
    "Усилители мощности",
    "Интегральные усилители"
  ]},
  { name: "Микрофоны", subcategories: [
    "Конденсаторные микрофоны",
    "Динамические микрофоны",
    "USB микрофоны",
    "Беспроводные микрофоны"
  ]},
  { name: "DJ Оборудование", subcategories: [
    "DJ контроллеры",
    "DJ микшеры",
    "Виниловые проигрыватели"
  ]}
];

// Предустановленные бренды
export const DEFAULT_BRANDS = [
  "Sony",
  "Audio-Technica",
  "Sennheiser",
  "JBL",
  "Bose",
  "Yamaha",
  "Pioneer",
  "Shure",
  "AKG",
  "Marshall"
];