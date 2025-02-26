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

  // Reviews - теперь с проверкой покупки
  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const productId = parseInt(req.params.id);
    const userId = req.user.id;

    // Проверяем, покупал ли пользователь этот товар
    const orders = await storage.getOrders(userId);
    const orderItems = await Promise.all(
        orders.map(order => storage.getOrderItems(order.id))
    );
    const hasPurchased = orderItems.flat().some(item => item.productId === productId);

    if (!hasPurchased) {
      return res.status(403).json({
        error: "Вы можете оставить отзыв только после покупки товара"
      });
    }

    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const review = await storage.createReview({
      ...parsed.data,
      userId,
      productId,
    });
    res.status(201).json(review);
  });


  // Управление товарами
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    try {
      // Проверяем данные с помощью схемы
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const product = await storage.createProduct(parsed.data);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
      // Проверяем существование продукта
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = await storage.updateProduct(productId, req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    try {
      // Проверяем существование продукта
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await storage.deleteProduct(productId);
      res.sendStatus(204);
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
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

  // Добавляем маршруты для заказов
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const orders = await storage.getOrders(req.user.id);
    res.json(orders);
  });

  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    const orders = await storage.getAllOrders();
    const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          const itemsWithProducts = await Promise.all(
              items.map(async (item) => {
                const product = await storage.getProduct(item.productId);
                return { ...item, product };
              })
          );
          return { ...order, items: itemsWithProducts };
        })
    );
    res.json(ordersWithDetails);
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const cartItems = await storage.getCartItems(req.user.id);
    if (cartItems.length === 0) return res.sendStatus(400);

    // Вычисляем общую сумму
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      totalAmount += product.price * item.quantity;
    }

    // Создаем заказ
    const order = await storage.createOrder({
      userId: req.user.id,
      totalAmount,
      status: 'pending',
      shippingAddress: req.body.shippingAddress,
      contactPhone: req.body.contactPhone
    });

    // Создаем элементы заказа
    await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: product.price
          });
        })
    );

    // Очищаем корзину
    await Promise.all(
        cartItems.map(item => storage.removeFromCart(item.id))
    );

    res.status(201).json(order);
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    const order = await storage.updateOrderStatus(
        parseInt(req.params.id),
        req.body.status
    );
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}