import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import type { Product, Category } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  price: z.string().regex(/^\d+(\.\d{2})?$/, "Preço inválido"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  image: z.string().url("URL de imagem inválida"),
  isAvailable: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "restaurant_owner") {
        toast({ title: "Acesso negado", description: "Você não tem permissão", variant: "destructive" });
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  }, []);

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/restaurant/products"],
    queryFn: () => apiRequest("GET", "/api/restaurant/products"),
    enabled: true,
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["/api/restaurant/categories"],
    queryFn: () => apiRequest("GET", "/api/restaurant/categories"),
    enabled: true,
  });

  const products = productsData?.data || [];
  const categories = (Array.isArray(categoriesData) ? categoriesData : []) as Category[];

  // Form setup
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      image: "",
      isAvailable: true,
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (editingId) {
        await apiRequest("PATCH", `/api/restaurant/products/${editingId}`, data);
      } else {
        await apiRequest("POST", "/api/restaurant/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/products"] });
      toast({ title: "Sucesso", description: editingId ? "Produto atualizado" : "Produto criado" });
      form.reset();
      setEditingId(null);
      setIsFormOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/restaurant/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/products"] });
      toast({ title: "Sucesso", description: "Produto deletado" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao deletar produto", variant: "destructive" });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId,
      image: product.image,
      isAvailable: product.isAvailable,
    });
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingId(null);
    form.reset();
  };

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/restaurant/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-red-600" data-testid="text-products-title">
              Gerenciar Produtos
            </h1>
          </div>
          {!isFormOpen && (
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-add-product"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          )}
        </div>

        {/* Form Section */}
        {isFormOpen && (
          <Card className="p-6 mb-8 border-red-200" data-testid="card-product-form">
            <h2 className="text-xl font-semibold mb-4" data-testid="text-form-title">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Pizza Margherita" {...field} data-testid="input-product-name" />
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
                          <Input placeholder="Ex: 45.00" {...field} data-testid="input-product-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do produto..."
                          {...field}
                          data-testid="input-product-description"
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
                        <Input placeholder="https://..." {...field} data-testid="input-product-image" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-save-product"
                  >
                    {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel-form"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        )}

        {/* Products Grid */}
        <div>
          {productsLoading ? (
            <p className="text-center text-muted-foreground" data-testid="text-loading">
              Carregando produtos...
            </p>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center" data-testid="card-empty">
              <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-add-first-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: Product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover-elevate"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${product.id}`}
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-product-desc-${product.id}`}>
                        {product.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-red-600" data-testid={`text-product-price-${product.id}`}>
                        R$ {product.price}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        data-testid={`badge-availability-${product.id}`}
                      >
                        {product.isAvailable ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
