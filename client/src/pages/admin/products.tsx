import { useAuth } from "@/hooks/use-auth";
import { Product, insertProductSchema } from "@shared/schema";
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

  const form = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "",
      brand: "",
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
    mutationFn: async (data: Product) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
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
        title: "Success",
        description: "Product updated successfully",
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
        title: "Success",
        description: "Product deleted successfully",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createProductMutation.mutate(data as Product)
                )}
                className="space-y-4"
              >
                <Input {...form.register("name")} placeholder="Name" />
                <Textarea
                  {...form.register("description")}
                  placeholder="Description"
                />
                <Input
                  {...form.register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="Price"
                />
                <Input {...form.register("imageUrl")} placeholder="Image URL" />
                <Input {...form.register("category")} placeholder="Category" />
                <Input {...form.register("brand")} placeholder="Brand" />
                <Input
                  {...form.register("stock", { valueAsNumber: true })}
                  type="number"
                  placeholder="Stock"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price}</TableCell>
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
                          <DialogTitle>Edit Product</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit((data) =>
                              updateProductMutation.mutate({
                                ...data,
                                id: product.id,
                              } as Product)
                            )}
                            className="space-y-4"
                          >
                            <Input
                              {...form.register("name")}
                              placeholder="Name"
                              defaultValue={product.name}
                            />
                            <Textarea
                              {...form.register("description")}
                              placeholder="Description"
                              defaultValue={product.description}
                            />
                            <Input
                              {...form.register("price", { valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              defaultValue={product.price}
                            />
                            <Input
                              {...form.register("imageUrl")}
                              placeholder="Image URL"
                              defaultValue={product.imageUrl}
                            />
                            <Input
                              {...form.register("category")}
                              placeholder="Category"
                              defaultValue={product.category}
                            />
                            <Input
                              {...form.register("brand")}
                              placeholder="Brand"
                              defaultValue={product.brand}
                            />
                            <Input
                              {...form.register("stock", { valueAsNumber: true })}
                              type="number"
                              placeholder="Stock"
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
                                "Update Product"
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
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this product? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteProductMutation.mutate(product.id)
                            }
                            disabled={deleteProductMutation.isPending}
                          >
                            {deleteProductMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Delete"
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
