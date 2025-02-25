import { User, InsertUser, Product, CartItem, Brand, Category, DEFAULT_BRANDS, DEFAULT_CATEGORIES, Review } from "@shared/schema";
import { db, users, brands, categories, products, cartItems, reviews } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  init(): Promise<void>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
    // Инициализация базы данных
    await this.initDefaultBrands();
    await this.initDefaultCategories();
    await this.initAdminUser();
  }

  private async initAdminUser() {
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      await db.insert(users).values({
        username: "admin",
        password: "admin123", // В реальном приложении нужно хешировать
        isAdmin: true
      });
    }
  }

  private async initDefaultBrands() {
    for (const brandName of DEFAULT_BRANDS) {
      const existingBrand = await db.query.brands.findFirst({
        where: eq(brands.name, brandName)
      });

      if (!existingBrand) {
        await db.insert(brands).values({
          name: brandName,
          description: `Официальный бренд ${brandName}`
        });
      }
    }
  }

  private async initDefaultCategories() {
    for (const category of DEFAULT_CATEGORIES) {
      let parentCategory = await db.query.categories.findFirst({
        where: eq(categories.name, category.name)
      });

      if (!parentCategory) {
        const [inserted] = await db.insert(categories)
          .values({
            name: category.name,
            description: `Категория ${category.name}`
          })
          .returning();
        parentCategory = inserted;
      }

      for (const subName of category.subcategories) {
        const existingSubCategory = await db.query.categories.findFirst({
          where: eq(categories.name, subName)
        });

        if (!existingSubCategory) {
          await db.insert(categories).values({
            name: subName,
            parentId: parentCategory.id,
            description: `Подкатегория ${subName}`
          });
        }
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return await db.select().from(brands);
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
    const [created] = await db.insert(brands).values(brand).returning();
    return created;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const [created] = await db
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .returning();
    return created;
  }

  async updateCartQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  // Review operations
  async getProductReviews(productId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
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