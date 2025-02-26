import { User, InsertUser, Product, CartItem, Brand, Category, DEFAULT_BRANDS, DEFAULT_CATEGORIES, Review, Order, InsertOrder, OrderItem, InsertOrderItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

class DatabaseStorage {
  constructor() {
    console.log('Initializing DatabaseStorage...');
  }

  async init() {
    console.log('Starting storage initialization...');
    try {
      await this.initBrandsIfNeeded();
      await this.initCategoriesIfNeeded();
      await this.initAdminIfNeeded();
      console.log('Storage initialization completed successfully');
    } catch (error) {
      console.error('Error during storage initialization:', error);
      throw error;
    }
  }

  private async initAdminIfNeeded() {
    console.log('Checking for admin user...');
    const admin = await this.getUserByUsername("admin");
    if (!admin) {
      console.log('Creating admin account...');
      await db.insert(schema.users).values({
        username: "admin",
        password: "admin123",
        isAdmin: true,
        phone: "+70000000000"
      });
      console.log('Admin account created successfully');
    }
  }

  private async initBrandsIfNeeded() {
    console.log('Checking for brands...');
    const existingBrands = await db.select().from(schema.brands);
    if (existingBrands.length === 0) {
      console.log('Creating default brands...');
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
    console.log('Checking for categories...');
    const existingCategories = await db.select().from(schema.categories);
    if (existingCategories.length === 0) {
      console.log('Creating default categories...');
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
    console.log('Getting user by id:', id);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    console.log('Found user:', user?.username);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log('Getting user by username:', username);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    console.log('Found user:', user?.username);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log('Creating new user:', user.username);
    const [created] = await db.insert(schema.users).values(user).returning();
    console.log('User created:', created.username);
    return created;
  }

  async updateUserPassword(id: number, password: string): Promise<void> { 
    console.log('Updating password for user id:', id);
    await db
      .update(schema.users)
      .set({ password })
      .where(eq(schema.users.id, id));
    console.log('Password updated successfully');
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
      const [products, allReviews] = await Promise.all([
        db.select().from(schema.products),
        db.select()
          .from(schema.reviews)
          .orderBy(desc(schema.reviews.createdAt))
      ]);

      const reviewsByProductId = new Map<number, Review[]>();
      allReviews.forEach(review => {
        const reviews = reviewsByProductId.get(review.productId) || [];
        reviews.push(review);
        reviewsByProductId.set(review.productId, reviews);
      });

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

  // Order operations
  async getOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(schema.orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db
      .update(schema.orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return updated;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(schema.orderItems).values(item).returning();
    return created;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));
  }
}

console.log('Creating storage instance...');
export const storage = new DatabaseStorage();

storage.init()
  .then(() => console.log('Storage initialized successfully'))
  .catch(error => {
    console.error('Failed to initialize storage:', error);
    process.exit(1);
  });