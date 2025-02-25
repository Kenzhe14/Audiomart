import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function OrdersPage() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">История заказов</h1>
      
      {orders.length === 0 ? (
        <p className="text-muted-foreground">У вас пока нет заказов</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Заказ #{order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {order.totalAmount.toLocaleString('ru-RU')} ₸
                  </p>
                  <p className="text-sm">
                    Статус: {
                      {
                        'pending': 'В обработке',
                        'processing': 'Комплектуется',
                        'shipped': 'Отправлен',
                        'delivered': 'Доставлен',
                        'cancelled': 'Отменён'
                      }[order.status]
                    }
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
