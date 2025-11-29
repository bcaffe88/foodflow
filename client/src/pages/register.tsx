import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { UserPlus, ArrowLeft } from "lucide-react";

type UserRole = "customer" | "driver";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("customer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role,
      });

      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      toast({ title: "Conta criada com sucesso!", description: "Bem-vindo!" });

      if (role === "driver") {
        navigate("/driver/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error?.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Criar Conta</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-md">
            <div className="p-6 md:p-8">
              <p className="text-muted-foreground text-center mb-6 text-xs md:text-sm">
                Escolha seu tipo de conta para começar
              </p>

              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  { value: "customer" as const, label: "Cliente" },
                  { value: "driver" as const, label: "Motorista" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRole(option.value)}
                    className={`py-2 px-3 rounded-md text-xs md:text-sm font-medium transition ${
                      role === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover-elevate"
                    }`}
                    data-testid={`button-role-${option.value}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleRegister} className="space-y-3 md:space-y-4">
                <div>
                  <Label htmlFor="name" className="text-xs md:text-sm">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    data-testid="input-name"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    data-testid="input-email"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-xs md:text-sm">Telefone/WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    data-testid="input-phone"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-xs md:text-sm">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    data-testid="input-password"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs md:text-sm">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    data-testid="input-confirm-password"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs md:text-sm"
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? "Criando..." : "Criar Conta"}
                </Button>
              </form>

              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                <p className="text-xs md:text-sm text-muted-foreground text-center">
                  Já tem uma conta?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
