import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

type UserRole = "customer" | "restaurant_owner" | "driver" | "platform_admin";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"customer" | "owner" | "driver" | "admin">("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });

      // Route based on role
      if (res.user.role === "restaurant_owner") {
        navigate("/restaurant/dashboard");
      } else if (res.user.role === "driver") {
        navigate("/driver/dashboard");
      } else if (res.user.role === "platform_admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleMap: Record<string, UserRole> = {
    customer: "customer",
    owner: "restaurant_owner",
    driver: "driver",
    admin: "platform_admin",
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              data-testid="button-back-login"
            >
              ← Voltar para Cardápio
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">Entrar</h1>
          <p className="text-muted-foreground text-center mb-6">
            Selecione seu tipo de conta
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { id: "customer", label: "Cliente" },
              { id: "owner", label: "Dono" },
              { id: "driver", label: "Moto" },
              { id: "admin", label: "Admin" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-2 rounded-md text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid={`button-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Não tem uma conta?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/register")}
              data-testid="button-register-link"
            >
              Criar Conta
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
