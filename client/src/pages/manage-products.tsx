import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
import { Plus, Edit, Trash2, Loader2, UtensilsCrossed, LogOut, ArrowLeft } from "lucide-react";

type FormData = z.infer<typeof insertProductSchema>;

export default function ManageProducts() {
  const [location, setLocation] = useLocation();
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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <UtensilsCrossed className="h-6 md:h-7 w-6 md:w-7 text-primary" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">Meu Cardápio</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation("/restaurant/dashboard")}
              data-testid="button-back"
              className="h-9 md:h-10 w-9 md:w-10"
            >
              <ArrowLeft className="h-4 md:h-5 w-4 md:w-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
              <LogOut className="h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 mb-6 md:mb-8">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Seus Pratos</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{products?.length || 0} produtos cadastrados</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              form.reset();
              setShowForm(!showForm);
            }}
            data-testid="button-add-product"
            className="gap-1 md:gap-2 text-xs md:text-sm w-full md:w-auto"
          >
            <Plus className="h-3 md:h-4 w-3 md:w-4" />
            <span>Adicionar Prato</span>
          </Button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 md:mb-8">
              <CardHeader className="p-4 md:p-6 pb-3 md:pb-3">
                <CardTitle className="text-base md:text-lg">{editingId ? "Editar" : "Novo Prato"}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 md:space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category" className="text-xs md:text-sm h-9 md:h-10">
                            <SelectValue placeholder="Selecione" />
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
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pizza Margherita" data-testid="input-product-name" className="text-xs md:text-sm h-9 md:h-10" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o prato..."
                          data-testid="textarea-product-description"
                          className="text-xs md:text-sm min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="45.00"
                            data-testid="input-product-price"
                            className="text-xs md:text-sm h-9 md:h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Imagem URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            data-testid="input-product-image"
                            className="text-xs md:text-sm h-9 md:h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-save-product"
                    className="flex-1 text-xs md:text-sm"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-3 md:h-4 w-3 md:w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Salvando...</span>
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
                    className="flex-1 text-xs md:text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 md:p-12 text-center">
              <UtensilsCrossed className="h-12 md:h-16 w-12 md:w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm md:text-base font-medium">Cardápio vazio</p>
              <p className="text-muted-foreground/70 text-xs md:text-sm mt-2">Adicione seus pratos favoritos</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          >
            {(products as Product[]).map((product: Product) => (
              <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ scale: 1.02 }}>
                <Card className="h-full overflow-hidden hover-elevate" data-testid={`card-product-${product.id}`}>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 md:h-40 object-cover"
                    />
                  )}
                  <CardContent className="p-3 md:p-4 pt-3 md:pt-4">
                    <h3 className="font-semibold text-sm md:text-base mb-1 truncate" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    <p className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4" data-testid={`text-price-${product.id}`}>
                      R$ {parseFloat(product.price.toString()).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                        data-testid={`button-edit-${product.id}`}
                        className="flex-1 text-xs md:text-sm h-8 md:h-9"
                      >
                        <Edit className="h-3 md:h-4 w-3 md:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${product.id}`}
                        className="flex-1 text-xs md:text-sm h-8 md:h-9"
                      >
                        <Trash2 className="h-3 md:h-4 w-3 md:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
