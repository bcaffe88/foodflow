import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Check } from "lucide-react";

interface LLMProductGeneratorProps {
  onProductsGenerated?: () => void;
}

export function LLMProductGenerator({ onProductsGenerated }: LLMProductGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!restaurantName.trim() || !cuisineType.trim()) {
      toast({ title: "Erro", description: "Preencha nome do restaurante e tipo de culinária", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/restaurant/products/generate-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          cuisineType,
          context,
        }),
      });

      if (!response.ok) throw new Error("Falha ao gerar produtos");
      
      const data = await response.json();
      setResult(data);
      toast({ title: "Sucesso!", description: `${data.productsCount} produtos criados com sucesso!` });
      onProductsGenerated?.();
      setTimeout(() => setOpen(false), 2000);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao gerar produtos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Gerador de Produtos com IA
          </CardTitle>
          <CardDescription>Monte seu cardápio automaticamente com ajuda de inteligência artificial</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Descreva seu restaurante e deixe a IA gerar sugestões de produtos com preços, descrições e categorias automáticas.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setOpen(true)} variant="default" className="w-full gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar Produtos com IA
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Produtos com IA</DialogTitle>
            <DialogDescription>Configure os parâmetros para gerar produtos automáticamente</DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-sm text-green-700 dark:text-green-200">{result.productsCount} produtos criados!</p>
                  <p className="text-xs text-green-600 dark:text-green-300">{result.summary}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Restaurante</label>
                <Input
                  placeholder="Ex: Pizzaria Maria"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  disabled={loading}
                  data-testid="input-restaurant-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Culinária</label>
                <Input
                  placeholder="Ex: Italiana, Tailandesa, Brasileira"
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  disabled={loading}
                  data-testid="input-cuisine-type"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contexto (Opcional)</label>
                <Textarea
                  placeholder="Ex: Restaurante premium, focado em ingredientes frescos locais"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  disabled={loading}
                  data-testid="input-context"
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !restaurantName.trim() || !cuisineType.trim()}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando produtos...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
