import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, Plus, Trash2, Edit2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function RestaurantProducts() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    isAvailable: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        apiRequest("GET", "/api/restaurant/products"),
        apiRequest("GET", "/api/restaurant/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/restaurant/products/${editingId}` : "/api/restaurant/products";
      
      await apiRequest(method, url, formData);
      toast({ title: "Sucesso", description: editingId ? "Produto atualizado!" : "Produto criado!" });
      
      setFormData({ name: "", description: "", price: "", image: "", categoryId: "", isAvailable: true });
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price as string,
      image: product.image,
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
    });
    setEditingId(product.id);
    setShowForm(true);
    
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('[data-testid="form-edit-product"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleToggleAvailable = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await apiRequest("PATCH", `/api/restaurant/products/${product.id}`, {
        isAvailable: !product.isAvailable,
      });
      toast({ 
        title: "Sucesso", 
        description: product.isAvailable ? "Produto desativado!" : "Produto ativado!" 
      });
      await loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar produto", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;
    try {
      await apiRequest("DELETE", `/api/restaurant/products/${id}`);
      toast({ title: "Sucesso", description: "Produto deletado!" });
      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Erro", description: "Falha ao deletar", variant: "destructive" });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Erro", description: "Nome da categoria é obrigatório", variant: "destructive" });
      return;
    }
    try {
      const newCat = await apiRequest("POST", "/api/restaurant/categories", {
        name: newCategoryName,
        slug: newCategoryName.toLowerCase().replace(/\s+/g, "-"),
      });
      setCategories([...categories, newCat]);
      setNewCategoryName("");
      setShowNewCategory(false);
      toast({ title: "Categoria criada!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar categoria", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Sem categoria";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/restaurant/dashboard")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!showForm ? (
          <>
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: "", description: "", price: "", image: "", categoryId: "", isAvailable: true });
              }}
              className="mb-6"
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>

            {categories.map((category) => {
              const categoryProducts = products.filter(p => p.categoryId === category.id);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 text-primary">{category.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <Badge variant={product.isAvailable ? "default" : "secondary"}>
                        {product.isAvailable ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">{getCategoryName(product.categoryId)}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold">R$ {Number(product.price).toFixed(2)}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={product.isAvailable ? "default" : "secondary"}
                          onClick={() => handleToggleAvailable(product)}
                          disabled={togglingId === product.id}
                          data-testid={`button-toggle-${product.id}`}
                          title={product.isAvailable ? "Desativar produto" : "Ativar produto"}
                        >
                          {product.isAvailable ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              </Card>
            )}
          </>
        ) : (
          <Card className="max-w-2xl mx-auto p-6" data-testid="form-edit-product">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  data-testid="input-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Preço</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    data-testid="input-price"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md"
                      required
                      data-testid="select-category"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCategory(!showNewCategory)}
                      data-testid="button-new-category"
                    >
                      +
                    </Button>
                  </div>
                  {showNewCategory && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nome da categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        data-testid="input-new-category"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCategory}
                        data-testid="button-create-category"
                      >
                        Criar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">URL da Imagem</label>
                <Input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  required
                  data-testid="input-image"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  data-testid="checkbox-available"
                />
                <label htmlFor="available" className="text-sm">Disponível</label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" data-testid="button-save">
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
