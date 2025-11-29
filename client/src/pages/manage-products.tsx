import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { insertProductSchema, type Product, type Category } from "@shared/schema";
import { z } from "zod";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { LLMProductGenerator } from "@/components/LLMProductGenerator";

type FormData = z.infer<typeof insertProductSchema>;

export default function ManageProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (!user || !token) {
      setLocation("/login");
    } else {
      const userData = JSON.parse(user);
      if (userData.role !== "restaurant_owner") {
        setLocation("/");
      }
    }
  }, [setLocation]);

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/restaurant/products"],
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/restaurant/categories"],
    enabled: !!user,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      tenantId: user?.tenantId || "",
      categoryId: "",
      name: "",
      description: "",
      price: "",
      image: "",
      isAvailable: true,
    },
  });

  // Create/Update product
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingId) {
        return await apiRequest(`PUT`, `/api/restaurant/products/${editingId}`, data);
      } else {
        return await apiRequest(`POST`, `/api/restaurant/products`, data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Produto atualizado" : "Produto criado",
        description: "Com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/products"] });
      form.reset();
      setEditingId(null);
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar produto",
        variant: "destructive",
      });
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`DELETE`, `/api/restaurant/products/${id}`),
    onSuccess: () => {
      toast({
        title: "Produto deletado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/products"] });
    },
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    form.reset({
      ...product,
      price: product.price.toString(),
    });
    setShowForm(true);
  };

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            form.reset();
            setShowForm(!showForm);
          }}
          data-testid="button-add-product"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* LLM Product Generator */}
      <div className="mb-8">
        <LLMProductGenerator onProductsGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/products"] });
        }} />
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Produto" : "Novo Produto"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pizza Margherita" data-testid="input-product-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o produto..."
                          data-testid="textarea-product-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="45.00"
                          data-testid="input-product-price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          data-testid="input-product-image"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-save-product"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Nenhum produto cadastrado. Crie o primeiro!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products as Product[]).map((product: Product) => (
            <Card key={product.id} data-testid={`card-product-${product.id}`}>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              )}
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-1" data-testid={`text-product-name-${product.id}`}>
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <p className="text-2xl font-bold text-green-600 mb-4" data-testid={`text-price-${product.id}`}>
                  R$ {parseFloat(product.price.toString()).toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    data-testid={`button-edit-${product.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(product.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
