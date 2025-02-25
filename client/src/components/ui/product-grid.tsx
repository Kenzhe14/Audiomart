import { Product } from "@shared/schema";
import ProductCard from "./product-card";
import { Skeleton } from "./skeleton";
import ProductFilters, { Filters } from "./product-filters";
import { useState } from "react";

export default function ProductGrid({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) {
  const [filters, setFilters] = useState<Filters>({});

  const filteredProducts = products.filter((product) => {
    if (filters.categoryId && product.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.brandId && product.brandId !== filters.brandId) {
      return false;
    }
    if (filters.minPrice && product.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && product.price > filters.maxPrice) {
      return false;
    }
    if (filters.minRating) {
      // Calculate average rating for the product
      const reviews = product.reviews || [];
      if (reviews.length === 0) return false;
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      if (avgRating < filters.minRating) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Skeleton className="h-[600px]" />
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Товары не найдены</h2>
        <p className="text-muted-foreground">
          Попробуйте изменить параметры поиска
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <ProductFilters onFiltersChange={setFilters} className="sticky top-4" />
      </div>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Товары не найдены</h2>
            <p className="text-muted-foreground">
              Попробуйте изменить параметры фильтрации
            </p>
          </div>
        )}
      </div>
    </div>
  );
}