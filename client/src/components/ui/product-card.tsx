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
import { lazy, Suspense, useState } from "react";
import { View, ImageIcon } from "lucide-react";
import { SafeSuspense } from "./safe-suspense";

const ProductView3D = lazy(() => import("./product-view-3d").then(mod => ({ default: mod.ProductView3D })));

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [show3D, setShow3D] = useState(false);

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
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

  return (
    <Card className="flex flex-col h-full transition-transform hover:scale-[1.02] motion-safe:hover:scale-[1.02] motion-reduce:hover:scale-100">
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{product.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{brand?.name}</span>
              <span>•</span>
              <span className="text-xs font-mono">SKU: {product.sku}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShow3D(!show3D)}
              className="relative"
            >
              {show3D ? (
                <ImageIcon className="h-4 w-4" />
              ) : (
                <View className="h-4 w-4" />
              )}
            </Button>
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
        <div className="aspect-square overflow-hidden rounded-md mb-4">
          {show3D ? (
            <SafeSuspense>
              <ProductView3D />
            </SafeSuspense>
          ) : (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-200 motion-safe:hover:scale-105 motion-reduce:hover:scale-100"
            />
          )}
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