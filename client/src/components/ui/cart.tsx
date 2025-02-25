import { ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItem, Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

export default function Cart() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  if (!user) return null;

  const cartProducts = cartItems.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId)!,
  }));

  const total = cartProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-4">
          {cartProducts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${item.product.price} x {item.quantity}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeFromCartMutation.mutate(item.id)}
                disabled={removeFromCartMutation.isPending}
              >
                Remove
              </Button>
            </div>
          ))}

          {cartProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">Cart is empty</p>
          ) : (
            <div className="pt-4 border-t">
              <p className="text-lg font-bold">
                Total: ${total.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
