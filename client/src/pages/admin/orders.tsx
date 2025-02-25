import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem, Product } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

export default function AdminOrdersPage() {
  const { toast } = useToast();
  
  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Статус заказа обновлен",
        description: "Статус заказа был успешно обновлен",
      });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Управление заказами</h1>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Товары</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>
                {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </TableCell>
              <TableCell>{order.userId}</TableCell>
              <TableCell>
                <ul className="list-disc list-inside">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-sm">
                      {item.product.name} (x{item.quantity})
                      <br />
                      <span className="text-xs text-muted-foreground">
                        SKU: {item.product.sku}
                      </span>
                    </li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>{order.totalAmount.toLocaleString('ru-RU')} ₸</TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ orderId: order.id, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">В обработке</SelectItem>
                    <SelectItem value="processing">Комплектуется</SelectItem>
                    <SelectItem value="shipped">Отправлен</SelectItem>
                    <SelectItem value="delivered">Доставлен</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {order.shippingAddress && (
                    <span className="text-xs text-muted-foreground">
                      Адрес: {order.shippingAddress}
                    </span>
                  )}
                  {order.contactPhone && (
                    <span className="text-xs text-muted-foreground">
                      Тел: {order.contactPhone}
                    </span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
