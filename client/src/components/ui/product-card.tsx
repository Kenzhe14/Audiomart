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

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();

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
    <Card className="flex flex-col h-full">
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
          {category && (
            <Badge variant="outline" className="text-xs">
              {category.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-square overflow-hidden rounded-md mb-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-200"
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
          >
            В корзину
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}