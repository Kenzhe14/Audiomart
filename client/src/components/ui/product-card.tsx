import { Product } from "@shared/schema";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { toast } = useToast();

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
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription>{product.brand}</CardDescription>
      </CardHeader>
      <CardContent>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover rounded-md"
        />
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-lg font-bold">${product.price}</span>
        {user && (
          <Button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
          >
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
