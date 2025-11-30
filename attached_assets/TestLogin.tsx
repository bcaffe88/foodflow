import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function TestLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Credenciais de teste pré-definidas
  const testAccounts = {
    "admin@test.com": {
      password: "admin123",
      role: "admin",
      name: "Administrador",
      redirect: "/developer",
    },
    "restaurant@test.com": {
      password: "restaurant123",
      role: "restaurant_owner",
      name: "Dono do Restaurante",
      redirect: "/restaurant",
    },
    "kitchen@test.com": {
      password: "kitchen123",
      role: "kitchen",
      name: "Cozinha",
      redirect: "/kitchen",
    },
    "delivery@test.com": {
      password: "delivery123",
      role: "delivery_driver",
      name: "Motoboy",
      redirect: "/delivery",
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const account = testAccounts[email as keyof typeof testAccounts];

      if (!account) {
        toast.error("Email não encontrado. Use um dos emails de teste.");
        setIsLoading(false);
        return;
      }

      if (account.password !== password) {
        toast.error("Senha incorreta");
        setIsLoading(false);
        return;
      }

      // Salvar dados de teste no localStorage
      const userData = {
        id: Math.random(),
        openId: `test-${email}`,
        name: account.name,
        email: email,
        role: account.role,
        loginMethod: "test",
        createdAt: new Date(),
      };

      localStorage.setItem("testUser", JSON.stringify(userData));
      localStorage.setItem("isTestMode", "true");

      toast.success(`Bem-vindo, ${account.name}!`);

      // Redirecionar para o painel apropriado
      setTimeout(() => {
        setLocation(account.redirect);
      }, 500);
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (testEmail: string) => {
    const account = testAccounts[testEmail as keyof typeof testAccounts];
    setEmail(testEmail);
    setPassword(account.password);

    // Auto-submit
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement;
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@test.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                Clique para login rápido:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => quickLogin("admin@test.com")}
                  className="w-full p-3 text-left rounded-lg border-2 border-blue-200 hover:bg-blue-50 transition"
                  disabled={isLoading}
                >
                  <div className="font-semibold text-blue-900">👨‍💼 Administrador</div>
                  <div className="text-xs text-blue-700">admin@test.com</div>
                </button>

                <button
                  onClick={() => quickLogin("restaurant@test.com")}
                  className="w-full p-3 text-left rounded-lg border-2 border-green-200 hover:bg-green-50 transition"
                  disabled={isLoading}
                >
                  <div className="font-semibold text-green-900">🍔 Restaurante</div>
                  <div className="text-xs text-green-700">restaurant@test.com</div>
                </button>

                <button
                  onClick={() => quickLogin("kitchen@test.com")}
                  className="w-full p-3 text-left rounded-lg border-2 border-orange-200 hover:bg-orange-50 transition"
                  disabled={isLoading}
                >
                  <div className="font-semibold text-orange-900">👨‍🍳 Cozinha</div>
                  <div className="text-xs text-orange-700">kitchen@test.com</div>
                </button>

                <button
                  onClick={() => quickLogin("delivery@test.com")}
                  className="w-full p-3 text-left rounded-lg border-2 border-purple-200 hover:bg-purple-50 transition"
                  disabled={isLoading}
                >
                  <div className="font-semibold text-purple-900">🏍️ Motoboy</div>
                  <div className="text-xs text-purple-700">delivery@test.com</div>
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900 font-semibold mb-2">
                📋 Credenciais de Teste:
              </p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  <strong>Admin:</strong> admin@test.com / admin123
                </p>
                <p>
                  <strong>Restaurante:</strong> restaurant@test.com / restaurant123
                </p>
                <p>
                  <strong>Cozinha:</strong> kitchen@test.com / kitchen123
                </p>
                <p>
                  <strong>Motoboy:</strong> delivery@test.com / delivery123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
