import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Bike, ArrowLeft } from "lucide-react";

const driverSchema = z.object({
  fullName: z.string().min(3, "Nome completo obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  licenseNumber: z.string().min(8, "Número da CNH obrigatório"),
  licenseExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
  vehicleType: z.enum(["motorcycle", "car"]),
  plateNumber: z.string().min(6, "Placa inválida"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type DriverFormData = z.infer<typeof driverSchema>;

export default function RegisterDriver() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cpf: "",
      licenseNumber: "",
      licenseExpiry: "",
      vehicleType: "motorcycle",
      plateNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: DriverFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register-driver", {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        cpf: data.cpf,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
      });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast({ title: "Bem-vindo!", description: "Cadastro realizado com sucesso" });
      navigate("/driver/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Falha ao registrar",
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
            <Bike className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Seja um Motorista</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-6 md:py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <Card className="w-full max-w-md mx-auto p-6 md:p-8">
              <p className="text-muted-foreground text-center mb-6 text-xs md:text-sm">Preencha seus dados para se cadastrar</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-fullName" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@example.com" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="11 99999-9999" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="123.456.789-00" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-cpf" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">CNH</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-licenseNumber" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <FormField
                      control={form.control}
                      name="licenseExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Validade CNH</FormLabel>
                          <FormControl>
                            <Input type="date" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-licenseExpiry" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs md:text-sm">Veículo</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full px-2 md:px-3 py-2 border border-input rounded-md text-xs md:text-sm h-9 md:h-10" data-testid="select-vehicleType">
                              <option value="motorcycle">Moto</option>
                              <option value="car">Carro</option>
                            </select>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="plateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Placa</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-1234" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-plateNumber" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-password" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs md:text-sm">Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" className="text-xs md:text-sm h-9 md:h-10" {...field} data-testid="input-confirmPassword" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full text-xs md:text-sm" disabled={isLoading} data-testid="button-submit">
                    {isLoading ? "Registrando..." : "Registrar como Motorista"}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-xs md:text-sm text-muted-foreground mt-4">
                Já tem conta? <button onClick={() => navigate("/login")} className="text-primary hover:underline">Faça login</button>
              </p>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
