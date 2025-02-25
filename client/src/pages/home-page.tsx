import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductGrid from "@/components/ui/product-grid";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HomePage() {
  const [search, setSearch] = useState("");
  
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products.filter(
    (p) => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto">
        <Input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ProductGrid products={filteredProducts} isLoading={isLoading} />
    </div>
  );
}
