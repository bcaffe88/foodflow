import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogIn, ChefHat, ArrowLeft } from "lucide-react";

export default function KitchenLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/kitchen/auth/login", {
        email,
        password,
        tenantId,
      });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify({
        id: res.staff.id,
        email: res.staff.email,
        name: res.staff.name,
        role: "kitchen_staff",
        tenantId: res.staff.tenantId,
      }));

      toast({ title: "✓ Bem-vindo à cozinha!", description: "Acesso autorizado" });
      navigate("/kitchen/dashboard");
    } catch (error) {
      toast({
        title: "Acesso negado",
        description: "Email, senha ou restaurante inválido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-lg">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold">Cozinha Premium</h1>
                <p className="text-sm text-muted-foreground">Acesso de funcionários</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId" className="text-sm font-medium">
                  ID do Restaurante
                </Label>
                <Input
                  id="tenantId"
                  type="text"
                  placeholder="Cole o ID do seu restaurante"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-tenant-id"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
                data-testid="button-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? "Entrando..." : "Entrar na Cozinha"}
              </Button>
            </form>

            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full mt-4"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200 text-sm text-blue-800">
              Solicite seu ID do restaurante e credenciais ao gerente
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
