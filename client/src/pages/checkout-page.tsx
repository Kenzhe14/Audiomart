import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CartItem, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";

const phoneRegex = /^\+7\d{10}$/;

const checkoutSchema = z.object({
  shippingAddress: z.string().min(1, "Укажите адрес доставки"),
  contactPhone: z.string()
    .min(1, "Укажите контактный телефон")
    .regex(phoneRegex, "Номер телефона должен быть в формате +7XXXXXXXXXX"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      contactPhone: "+7"
    }
  });

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Заказ оформлен",
        description: "Ваш заказ успешно создан",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setLocation("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isCartLoading || isProductsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const cartProducts = cartItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    return { ...item, product };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const total = cartProducts.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (cartProducts.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Корзина пуста</CardTitle>
          <CardDescription>
            Добавьте товары в корзину, чтобы оформить заказ
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => setLocation("/")} className="w-full">
            Перейти к покупкам
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Оформление заказа</h1>

      <Card>
        <CardHeader>
          <CardTitle>Товары в заказе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartProducts.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.product.price.toLocaleString('ru-RU')} ₸ × {item.quantity}
                  </p>
                </div>
              </div>
              <p className="font-medium">
                {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₸
              </p>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-lg font-bold">
            Итого: {total.toLocaleString('ru-RU')} ₸
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Данные для доставки</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createOrderMutation.mutate(data))}
              className="space-y-4"
            >
              <Input
                {...form.register("shippingAddress")}
                placeholder="Адрес доставки"
              />
              <Input
                {...form.register("contactPhone")}
                placeholder="Контактный телефон"
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith('+7')) {
                    value = '+7' + value.replace('+7', '');
                  }
                  e.target.value = value;
                  form.setValue("contactPhone", value);
                }}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Подтвердить заказ
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}