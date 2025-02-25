import { User, InsertUser, Product, CartItem, Brand, Category, DEFAULT_BRANDS, DEFAULT_CATEGORIES } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private brands: Map<number, Brand>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private currentId: Record<string, number>;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.brands = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.currentId = { 
      users: 1, 
      brands: 1, 
      categories: 1, 
      products: 1, 
      cartItems: 1 
    };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async init() {
    await this.initAdminUser();
    await this.initDefaultBrands();
    await this.initDefaultCategories();
  }

  private async initAdminUser() {
    const hashedPassword = await hashPassword("admin123");
    const adminUser: User = {
      id: this.currentId.users++,
      username: "admin",
      password: hashedPassword,
      isAdmin: true
    };
    this.users.set(adminUser.id, adminUser);
  }

  private async initDefaultBrands() {
    for (const brandName of DEFAULT_BRANDS) {
      const brand: Brand = {
        id: this.currentId.brands++,
        name: brandName,
        description: `Официальный бренд ${brandName}`
      };
      this.brands.set(brand.id, brand);
    }
  }

  private async initDefaultCategories() {
    for (const category of DEFAULT_CATEGORIES) {
      const parentCategory: Category = {
        id: this.currentId.categories++,
        name: category.name,
        parentId: null,
        description: `Категория ${category.name}`
      };
      this.categories.set(parentCategory.id, parentCategory);

      for (const subName of category.subcategories) {
        const subCategory: Category = {
          id: this.currentId.categories++,
          name: subName,
          parentId: parentCategory.id,
          description: `Подкатегория ${subName}`
        };
        this.categories.set(subCategory.id, subCategory);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values());
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async createBrand(brand: Omit<Brand, "id">): Promise<Brand> {
    const id = this.currentId.brands++;
    const newBrand = { ...brand, id };
    this.brands.set(id, newBrand);
    return newBrand;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const id = this.currentId.categories++;
    const newCategory = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const id = this.currentId.products++;
    const newProduct = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, update: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) throw new Error("Product not found");

    const updatedProduct = { ...product, ...update };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const id = this.currentId.cartItems++;
    const cartItem = { id, userId, productId, quantity };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartQuantity(id: number, quantity: number): Promise<CartItem> {
    const item = this.cartItems.get(id);
    if (!item) throw new Error("Cart item not found");

    const updated = { ...item, quantity };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }
}

export const storage = new MemStorage();

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