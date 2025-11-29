import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogIn, Mail, Lock, ShoppingCart } from "lucide-react";

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

      toast({ title: "✅ Login realizado!", description: "Bem-vindo de volta!" });

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
        title: "❌ Erro ao fazer login",
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

  const demoAccounts = {
    customer: { email: "customer@example.com", password: "password" },
    owner: { email: "wilson@wilsonpizza.com", password: "wilson123" },
    driver: { email: "driver@example.com", password: "password" },
    admin: { email: "admin@foodflow.com", password: "Admin123!" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-0 overflow-hidden border-0 shadow-xl bg-background/80 backdrop-blur-xl">
          {/* Header */}
          <div className="p-8 pb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-6"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                data-testid="button-back-login"
                className="h-8"
              >
                ← Voltar
              </Button>
            </motion.div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Entrar</h1>
                <p className="text-sm text-muted-foreground">Acesse sua conta FoodFlow</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Role Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 mb-6"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Conta</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "customer", label: "Cliente", icon: "🍽️" },
                  { id: "owner", label: "Dono", icon: "🏪" },
                  { id: "driver", label: "Moto", icon: "🚗" },
                  { id: "admin", label: "Admin", icon: "⚙️" },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      const account = demoAccounts[tab.id as keyof typeof demoAccounts];
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border/50"
                    }`}
                    data-testid={`button-tab-${tab.id}`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-border/50 focus:border-primary"
                    data-testid="input-email"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 border-border/50 focus:border-primary"
                    data-testid="input-password"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  data-testid="button-submit-login"
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                  <LogIn className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center pt-2"
              >
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="text-primary hover:text-primary/80 underline font-medium"
                    data-testid="button-go-register"
                  >
                    Criar uma
                  </button>
                </p>
              </motion.div>
            </form>

            {/* Demo Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-6 border-t border-border/50"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Demo - Contas de Teste</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex justify-between"><span>Cliente:</span> <span className="font-mono">customer@example.com</span></p>
                <p className="flex justify-between"><span>Dono:</span> <span className="font-mono">wilson@wilsonpizza.com</span></p>
                <p className="flex justify-between"><span>Motorista:</span> <span className="font-mono">driver@example.com</span></p>
                <p className="flex justify-between"><span>Admin:</span> <span className="font-mono">admin@foodflow.com</span></p>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
