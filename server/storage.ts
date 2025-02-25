import { User, InsertUser, Product, CartItem, Brand, Category, DEFAULT_BRANDS, DEFAULT_CATEGORIES, Review } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import * as schema from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  init(): Promise<void>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>; // Added method signature

  // Brand operations
  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(brand: Omit<Brand, "id">): Promise<Brand>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: Omit<Category, "id">): Promise<Category>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(userId: number, productId: number, quantity: number): Promise<CartItem>;
  updateCartQuantity(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;

  // Review operations
  getProductReviews(productId: number): Promise<Review[]>;
  createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review>;
  getProductsWithReviews(): Promise<(Product & { reviews: Review[] })[]>;
  getProductWithReviews(id: number): Promise<(Product & { reviews: Review[] }) | undefined>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async init() {
    console.log('Начало инициализации хранилища...');

    try {
      // Параллельная инициализация для ускорения запуска
      await Promise.all([
        this.initBrandsIfNeeded(),
        this.initCategoriesIfNeeded(),
        this.initAdminIfNeeded()
      ]);

      console.log('Инициализация хранилища завершена успешно');
    } catch (error) {
      console.error('Ошибка при инициализации хранилища:', error);
      throw error;
    }
  }

  private async initAdminIfNeeded() {
    console.log('Проверка наличия администратора...');
    const admin = await this.getUserByUsername("admin");

    if (!admin) {
      console.log('Создание аккаунта администратора...');
      await db.insert(schema.users).values({
        username: "admin",
        password: "admin123", // В реальном приложении нужно хешировать
        isAdmin: true
      });
    }
  }

  private async initBrandsIfNeeded() {
    console.log('Проверка наличия брендов...');
    const existingBrands = await db.select().from(schema.brands);

    if (existingBrands.length === 0) {
      console.log('Создание базовых брендов...');
      await Promise.all(
        DEFAULT_BRANDS.map(brandName =>
          db.insert(schema.brands).values({
            name: brandName,
            description: `Официальный бренд ${brandName}`
          })
        )
      );
    }
  }

  private async initCategoriesIfNeeded() {
    console.log('Проверка наличия категорий...');
    const existingCategories = await db.select().from(schema.categories);

    if (existingCategories.length === 0) {
      console.log('Создание базовых категорий...');
      for (const category of DEFAULT_CATEGORIES) {
        const [parentCategory] = await db.insert(schema.categories)
          .values({
            name: category.name,
            description: `Категория ${category.name}`
          })
          .returning();

        await Promise.all(
          category.subcategories.map(subName =>
            db.insert(schema.categories).values({
              name: subName,
              parentId: parentCategory.id,
              description: `Подкатегория ${subName}`
            })
          )
        );
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(schema.users).values(user).returning();
    return created;
  }

  async updateUserPassword(id: number, password: string): Promise<void> { // Added method implementation
    await db
      .update(schema.users)
      .set({ password })
      .where(eq(schema.users.id, id));
  }

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return await db.select().from(schema.brands);
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, id));
    return brand;
  }

  async createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
    const [created] = await db.insert(schema.brands).values(brand).returning();
    return created;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return category;
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const [created] = await db.insert(schema.categories).values(category).returning();
    return created;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(schema.products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const [created] = await db.insert(schema.products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product> {
    const [updated] = await db
      .update(schema.products)
      .set(productUpdate)
      .where(eq(schema.products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(schema.cartItems)
      .where(eq(schema.cartItems.userId, userId));
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const [created] = await db
      .insert(schema.cartItems)
      .values({ userId, productId, quantity })
      .returning();
    return created;
  }

  async updateCartQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(schema.cartItems)
      .set({ quantity })
      .where(eq(schema.cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(schema.cartItems).where(eq(schema.cartItems.id, id));
  }

  // Review operations
  async getProductReviews(productId: number): Promise<Review[]> {
    return await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.productId, productId))
      .orderBy(desc(schema.reviews.createdAt));
  }

  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const [created] = await db.insert(schema.reviews).values(review).returning();
    return created;
  }

  async getProductsWithReviews(): Promise<(Product & { reviews: Review[] })[]> {
    try {
      // Получаем все продукты и обзоры за один запрос
      const [products, allReviews] = await Promise.all([
        db.select().from(schema.products),
        db.select().from(schema.reviews).orderBy(desc(schema.reviews.createdAt))
      ]);

      // Создаем карту обзоров по productId для быстрого доступа
      const reviewsByProductId = new Map<number, Review[]>();
      allReviews.forEach(review => {
        const reviews = reviewsByProductId.get(review.productId) || [];
        reviews.push(review);
        reviewsByProductId.set(review.productId, reviews);
      });

      // Объединяем продукты с их обзорами
      return products.map(product => ({
        ...product,
        reviews: reviewsByProductId.get(product.id) || []
      }));
    } catch (error) {
      console.error('Error fetching products with reviews:', error);
      throw error;
    }
  }

  async getProductWithReviews(id: number): Promise<(Product & { reviews: Review[] }) | undefined> {
    const [product] = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id));

    if (!product) return undefined;

    const reviews = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.productId, id))
      .orderBy(desc(schema.reviews.createdAt));

    return {
      ...product,
      reviews
    };
  }
}

export const storage = new DatabaseStorage();

// Initialize storage
(async () => {
  try {
    await storage.init();
    console.log('Storage initialized successfully');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    process.exit(1);
  }
})();