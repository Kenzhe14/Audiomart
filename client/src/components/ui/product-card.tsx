import { Product, Brand, Category } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import ProductReviews from "./product-reviews";
import { ShareButtons } from "./share-buttons";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: brands = [], isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const brand = brands.find(b => b.id === product.brandId);
  const category = categories.find(c => c.id === product.categoryId);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Добавлено в корзину",
        description: `${product.name} добавлен в вашу корзину.`,
      });
    },
  });

  if (brandsLoading || categoriesLoading) {
    return (
      <Card className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full transition-transform hover:scale-[1.02] motion-safe:hover:scale-[1.02] motion-reduce:hover:scale-100">
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{product.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{brand?.name}</span>
              <Badge variant="outline" className="text-xs">
                SKU: {product.sku}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ShareButtons
              title={product.name}
              url={window.location.origin + "/products/" + product.id}
            />
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-square overflow-hidden rounded-md mb-4 relative">
          <div 
            className={`absolute inset-0 bg-muted animate-pulse ${imageLoaded ? 'hidden' : ''}`}
          />
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="flex-none flex justify-between items-center gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-bold">{product.price.toLocaleString('ru-RU')} ₸</span>
          <span className="text-xs text-muted-foreground">
            {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет в наличии'}
          </span>
        </div>
        {user && product.stock > 0 && (
          <Button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
            className="transition-transform hover:scale-105"
          >
            {addToCartMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            В корзину
          </Button>
        )}
      </CardFooter>
      <div className="mt-6 px-6 pb-6">
        <ProductReviews productId={product.id} />
      </div>
    </Card>
  );
}