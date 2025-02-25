import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
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

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  shippingAddress: text("shipping_address"),
  contactPhone: text("contact_phone")
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: doublePrecision("price_at_time").notNull()
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1)
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertBrandSchema = createInsertSchema(brands);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertReviewSchema = createInsertSchema(reviews).extend({
  rating: z.number().min(1).max(5)
});

export const insertOrderSchema = createInsertSchema(orders).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ 
  id: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

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