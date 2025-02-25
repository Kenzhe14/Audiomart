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
import { useState } from "react";

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
    },
  });

  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: Omit<Product, "id" | "sku">) => {
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createProductMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <Input {...form.register("name")} placeholder="Название" />
                <Textarea
                  {...form.register("description")}
                  placeholder="Описание"
                />
                <Input
                  {...form.register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="Цена"
                />
                <Input 
                  {...form.register("imageUrl")} 
                  placeholder="URL изображения" 
                />
                <Select 
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
                <Select 
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
                <Input
                  {...form.register("stock", { valueAsNumber: true })}
                  type="number"
                  placeholder="Количество"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Создать товар"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
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
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit((data) =>
                              updateProductMutation.mutate({
                                ...data,
                                id: product.id,
                                sku: product.sku,
                              })
                            )}
                            className="space-y-4"
                          >
                            <Input
                              {...form.register("name")}
                              placeholder="Название"
                              defaultValue={product.name}
                            />
                            <Textarea
                              {...form.register("description")}
                              placeholder="Описание"
                              defaultValue={product.description}
                            />
                            <Input
                              {...form.register("price", { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              placeholder="Цена"
                              defaultValue={product.price}
                            />
                            <Input
                              {...form.register("imageUrl")}
                              placeholder="URL изображения"
                              defaultValue={product.imageUrl}
                            />
                            <Select 
                              defaultValue={product.categoryId.toString()}
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
                            <Select 
                              defaultValue={product.brandId.toString()}
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
                            <Input
                              {...form.register("stock", { valueAsNumber: true })}
                              type="number"
                              placeholder="Количество"
                              defaultValue={product.stock}
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={updateProductMutation.isPending}
                            >
                              {updateProductMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Обновить товар"
                              )}
                            </Button>
                          </form>
                        </Form>
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