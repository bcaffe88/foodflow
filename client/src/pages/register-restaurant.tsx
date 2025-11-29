import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Store, ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(10),
});

export default function RegisterRestaurantPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register-restaurant", data);
      toast({
        title: "Sucesso!",
        description: "Seu cadastro foi enviado. Aguarde aprovação do admin.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar restaurante",
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
            <Store className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Seu Restaurante</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="w-full max-w-md p-6 md:p-8">
            <p className="text-muted-foreground text-center mb-6 text-xs md:text-sm">Cadastre seu restaurante na plataforma</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Nome do Restaurante</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu Restaurante" className="text-xs md:text-sm h-9 md:h-10" {...field} />
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
                        <Input type="email" placeholder="seu@email.com" className="text-xs md:text-sm h-9 md:h-10" {...field} />
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
                        <Input placeholder="558799999999" className="text-xs md:text-sm h-9 md:h-10" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs md:text-sm">Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, cidade..." className="text-xs md:text-sm h-9 md:h-10" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-xs md:text-sm" disabled={isLoading} data-testid="button-submit">
                  {isLoading ? "Enviando..." : "Registrar Restaurante"}
                </Button>
              </form>
            </Form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
