import { ShoppingCart, Loader2 } from "lucide-react";
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

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
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

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  if (!user) return null;

  // Only proceed with cart calculations if we have both cart items and products
  const cartProducts = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    return { ...item, product };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const total = cartProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Show loading state while data is being fetched
  if (isCartLoading || isProductsLoading) {
    return (
      <Button variant="ghost" disabled className="relative">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Button>
    );
  }

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
          <SheetTitle>Корзина</SheetTitle>
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
                  {item.product.price.toLocaleString('ru-RU')} ₸
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => 
                    updateQuantityMutation.mutate({
                      id: item.id,
                      quantity: Math.max(1, item.quantity - 1)
                    })
                  }
                  disabled={updateQuantityMutation.isPending}
                >
                  -
                </Button>
                <span className="min-w-[2rem] text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => 
                    updateQuantityMutation.mutate({
                      id: item.id,
                      quantity: item.quantity + 1
                    })
                  }
                  disabled={updateQuantityMutation.isPending}
                >
                  +
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFromCartMutation.mutate(item.id)}
                  disabled={removeFromCartMutation.isPending}
                >
                  ×
                </Button>
              </div>
            </div>
          ))}

          {cartProducts.length === 0 ? (
            <p className="text-center text-muted-foreground">Корзина пуста</p>
          ) : (
            <div className="pt-4 border-t">
              <p className="text-lg font-bold">
                Итого: {total.toLocaleString('ru-RU')} ₸
              </p>
              <Button className="w-full mt-4" onClick={() => setIsOpen(false)}>
                Оформить заказ
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}