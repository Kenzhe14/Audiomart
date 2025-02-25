import { useAuth } from "@/hooks/use-auth";
import { Product, insertProductSchema, Brand, Category } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";

export default function AdminProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: 0,
      brandId: 0,
      stock: 0,
      sku: ""
    },
  });

  // Редирект если не админ
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  useEffect(() => {
    if (editingProduct) {
      // Заполняем форму данными редактируемого товара
      form.reset({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        imageUrl: editingProduct.imageUrl,
        categoryId: editingProduct.categoryId,
        brandId: editingProduct.brandId,
        stock: editingProduct.stock,
        sku: editingProduct.sku
      });
    } else {
      // Сбрасываем форму при создании нового товара
      form.reset({
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        categoryId: 0,
        brandId: 0,
        stock: 0,
        sku: ""
      });
    }
  }, [editingProduct, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: Omit<Product, "id">) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Успех",
        description: "Товар успешно создан",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: Product) => {
      const res = await apiRequest("PATCH", `/api/products/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      form.reset();
      toast({
        title: "Успех",
        description: "Товар успешно обновлен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeletingProductId(null);
      toast({
        title: "Успех",
        description: "Товар успешно удален",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getBrandName = (brandId: number) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || 'Неизвестный бренд';
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Неизвестная категория';
  };

  const ProductForm = () => (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          editingProduct
            ? updateProductMutation.mutate({ ...data, id: editingProduct.id })
            : createProductMutation.mutate(data)
        )}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Название</label>
          <Input {...form.register("name")} placeholder="Название товара" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Артикул (SKU)</label>
          <Input {...form.register("sku")} placeholder="SKU товара" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Описание</label>
          <Textarea
            {...form.register("description")}
            placeholder="Описание товара"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Цена</label>
          <Input
            {...form.register("price", { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="Цена"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">URL изображения</label>
          <Input
            {...form.register("imageUrl")}
            placeholder="URL изображения"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Категория</label>
          <Select
            value={form.getValues("categoryId").toString()}
            onValueChange={(value) =>
              form.setValue("categoryId", parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.id.toString()}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Бренд</label>
          <Select
            value={form.getValues("brandId").toString()}
            onValueChange={(value) =>
              form.setValue("brandId", parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem
                  key={brand.id}
                  value={brand.id.toString()}
                >
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Количество на складе</label>
          <Input
            {...form.register("stock", { valueAsNumber: true })}
            type="number"
            placeholder="Количество"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createProductMutation.isPending || updateProductMutation.isPending}
        >
          {(createProductMutation.isPending || updateProductMutation.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            editingProduct ? "Обновить товар" : "Создать товар"
          )}
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Управление товарами</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Добавить товар
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить новый товар</DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{getBrandName(product.brandId)}</TableCell>
                <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                <TableCell>{product.price.toLocaleString('ru-RU')} ₸</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={editingProduct?.id === product.id}
                      onOpenChange={(open) =>
                        setEditingProduct(open ? product : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Редактировать товар</DialogTitle>
                        </DialogHeader>
                        <ProductForm />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={deletingProductId === product.id}
                      onOpenChange={(open) =>
                        setDeletingProductId(open ? product.id : null)
                      }
                    >
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeletingProductId(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить товар</AlertDialogTitle>
                          <AlertDialogDescription>
                            Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteProductMutation.mutate(product.id)
                            }
                            disabled={deleteProductMutation.isPending}
                          >
                            {deleteProductMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Удалить"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}