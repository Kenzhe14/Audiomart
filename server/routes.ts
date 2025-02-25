import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema } from "@shared/schema";
import { insertReviewSchema } from "@shared/schema";

// Кэш для брендов и категорий
let brandsCache: any[] = [];
let categoriesCache: any[] = [];
let lastBrandsFetch = 0;
let lastCategoriesFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Brands with caching
  app.get("/api/brands", async (_req, res) => {
    const now = Date.now();
    if (now - lastBrandsFetch > CACHE_TTL || brandsCache.length === 0) {
      brandsCache = await storage.getBrands();
      lastBrandsFetch = now;
    }
    res.json(brandsCache);
  });

  app.get("/api/brands/:id", async (req, res) => {
    const brand = brandsCache.find(b => b.id === parseInt(req.params.id)) ||
                 await storage.getBrand(parseInt(req.params.id));
    if (!brand) return res.sendStatus(404);
    res.json(brand);
  });

  // Categories with caching
  app.get("/api/categories", async (_req, res) => {
    const now = Date.now();
    if (now - lastCategoriesFetch > CACHE_TTL || categoriesCache.length === 0) {
      categoriesCache = await storage.getCategories();
      lastCategoriesFetch = now;
    }
    res.json(categoriesCache);
  });

  app.get("/api/categories/:id", async (req, res) => {
    const category = categoriesCache.find(c => c.id === parseInt(req.params.id)) ||
                    await storage.getCategory(parseInt(req.params.id));
    if (!category) return res.sendStatus(404);
    res.json(category);
  });

  // Products with reviews included
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProductsWithReviews();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProductWithReviews(parseInt(req.params.id));
    if (!product) return res.sendStatus(404);
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    // Генерируем уникальный SKU
    const sku = `SKU${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const productData = { ...req.body, sku };

    const parsed = insertProductSchema.safeParse(productData);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    try {
      const product = await storage.updateProduct(
        parseInt(req.params.id),
        req.body
      );
      res.json(product);
    } catch (err) {
      res.sendStatus(404);
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    await storage.deleteProduct(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Reviews
  app.get("/api/products/:id/reviews", async (req, res) => {
    const reviews = await storage.getProductReviews(parseInt(req.params.id));
    res.json(reviews);
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const review = await storage.createReview({
      ...parsed.data,
      userId: req.user.id,
      productId: parseInt(req.params.id),
    });
    res.status(201).json(review);
  });


  // Cart
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const items = await storage.getCartItems(req.user.id);
    res.json(items);
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { productId, quantity } = req.body;
    const item = await storage.addToCart(req.user.id, productId, quantity);
    res.status(201).json(item);
  });

  app.patch("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const item = await storage.updateCartQuantity(
        parseInt(req.params.id),
        req.body.quantity
      );
      res.json(item);
    } catch (err) {
      res.sendStatus(404);
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.removeFromCart(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}