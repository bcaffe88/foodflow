import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";

export default function ProductManagement() {
  const { user, loading, isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    imageUrl: "",
    isAvailable: true,
  });

  const { data: restaurant } = trpc.restaurant.getActive.useQuery();
  const { data: categories } = trpc.categories.list.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant }
  );
  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant }
  );

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      refetchProducts();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado!");
      refetchProducts();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produto removido!");
      refetchProducts();
    },
    onError: () => {
      toast.error("Erro ao remover produto");
    },
  });

  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      imageUrl: "",
      isAvailable: true,
    });
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    if (!productForm.name || !productForm.categoryId || productForm.price <= 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      ...productForm,
      restaurantId: restaurant?.id || 1,
      price: Math.round(productForm.price * 100), // Convert to cents
    };

    if (editingProduct) {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        ...data,
      });
    } else {
      await createProductMutation.mutateAsync(data);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price / 100,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || "",
      isAvailable: product.isAvailable,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      await deleteProductMutation.mutateAsync({ id });
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "restaurant_owner" && user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Você não tem permissão para acessar esta página</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (window.location.href = "/restaurant")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Gestão de Produtos</h1>
                <p className="text-sm opacity-90">Adicione e edite produtos do cardápio</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={productForm.categoryId.toString()}
                        onValueChange={(value) =>
                          setProductForm({
                            ...productForm,
                            categoryId: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">URL da Imagem</Label>
                    <Input
                      id="imageUrl"
                      placeholder="/products/image.jpg"
                      value={productForm.imageUrl}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          imageUrl: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole a URL da imagem ou use o caminho relativo (ex: /products/hamburguer.jpg)
                    </p>
                  </div>

                  {productForm.imageUrl && (
                    <div className="border rounded-lg p-4">
                      <Label>Preview da Imagem</Label>
                      <img
                        src={productForm.imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mt-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/400x300?text=Imagem+Indisponível";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={productForm.isAvailable}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          isAvailable: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="isAvailable">Produto disponível</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        createProductMutation.isPending ||
                        updateProductMutation.isPending
                      }
                      className="flex-1"
                    >
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Produtos do Cardápio</CardTitle>
          </CardHeader>
          <CardContent>
            {!products || products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto cadastrado</p>
                <p className="text-sm mt-2">Clique em "Novo Produto" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={product.imageUrl || "https://via.placeholder.com/80"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/80";
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {categories?.find((c) => c.id === product.categoryId)?.name}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            product.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.isAvailable ? "Disponível" : "Indisponível"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
