import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Utensils, Bike, ShoppingCart, TrendingUp, Users, Zap, CheckCircle, Shield, Clock, Flame, Award, MapPin } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "FoodFlow - Plataforma de Delivery de Comida | Rápido e Confiável";
    document.documentElement.lang = "pt-BR";
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent" data-testid="text-logo">
              FoodFlow
            </span>
          </motion.div>
          
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              data-testid="button-login"
            >
              Entrar
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/register")}
              data-testid="button-signup"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-20 left-0 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute -bottom-8 right-0 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Entrega Rápida e Segura</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Comida Rápida,<br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Entregue Melhor
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          A plataforma completa de delivery que conecta clientes, restaurantes e motoristas. 
          Peça suas refeições favoritas e receba em minutos, rastreando cada entrega em tempo real.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-4 justify-center mb-16 flex-wrap"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/restaurants")}
            data-testid="button-explore"
          >
            Explorar Restaurantes
            <Utensils className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate("/register-restaurant")}
            data-testid="button-partner"
          >
            Seja um Parceiro
            <MapPin className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-20 pt-12 border-t border-border/50"
        >
          {[
            { value: "5.000+", label: "Restaurantes Ativos", icon: Utensils },
            { value: "500K+", label: "Clientes Satisfeitos", icon: Users },
            { value: "25 min", label: "Entrega Média", icon: Clock },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm md:text-base text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl my-12">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 md:mb-20"
        >
          Como Funciona
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {[
            { step: "1", icon: ShoppingCart, title: "Escolha", description: "Procure seu restaurante favorito na plataforma" },
            { step: "2", icon: Utensils, title: "Selecione", description: "Escolha seus pratos e customize à vontade" },
            { step: "3", icon: Bike, title: "Entrega", description: "Acompanhe o motorista em tempo real no mapa" },
            { step: "4", icon: CheckCircle, title: "Aproveite", description: "Receba quente e desfrute com qualidade" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="relative"
            >
              <Card className="p-8 text-center h-full hover-elevate border-2 border-transparent hover:border-primary/20 transition-all group">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 md:mb-20"
        >
          Por Que Escolher FoodFlow?
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {[
            { icon: ShoppingCart, title: "Pedidos Simples", desc: "Interface intuitiva para buscas rápidas e comparações fáceis" },
            { icon: Bike, title: "Entrega Rápida", desc: "Rastreamento real-time e motoristas certificados" },
            { icon: Utensils, title: "Variedade Infinita", desc: "Centenas de restaurantes com todas as culinárias" },
            { icon: TrendingUp, title: "Para Restaurantes", desc: "Ferramenta poderosa para crescimento dos negócios" },
            { icon: Users, title: "Comunidade Forte", desc: "Rede crescente de amantes de comida" },
            { icon: Zap, title: "Tecnologia", desc: "Múltiplas formas de pagamento seguro e integrado" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
            >
              <Card className="p-8 h-full hover-elevate border-2 border-transparent hover:border-primary/20 transition-all group">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-3 text-lg group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-3xl">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {[
            { icon: Shield, label: "Segurança 100%", value: "SSL Certificado" },
            { icon: Award, label: "Avaliação Média", value: "4.9/5 Estrelas" },
            { icon: Users, label: "Usuários Verificados", value: "500K+ Ativos" },
          ].map((proof, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 mx-auto group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                <proof.icon className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-2">{proof.label}</p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{proof.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-12 md:p-16 bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 shadow-xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center leading-tight">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-center text-lg leading-relaxed">
              Junte-se a milhares de usuários que já descobriram a melhor forma de pedir comida. Escolha seu papel: cliente, restaurante ou motorista.
            </p>
            <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all flex-1 md:flex-none"
                onClick={() => navigate("/restaurants")}
                data-testid="button-order-now"
              >
                Pedir Agora
                <ShoppingCart className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 md:flex-none shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("/register-driver")}
                data-testid="button-drive"
              >
                Seja Motorista
                <Bike className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 md:flex-none shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("/register-restaurant")}
                data-testid="button-register-restaurant-landing"
              >
                Abra Restaurante
                <Utensils className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-background to-background/50 py-12 md:py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">FoodFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">A melhor plataforma de delivery</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Clientes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/restaurants")} className="hover:text-foreground transition">Restaurantes</button></li>
                <li><button onClick={() => navigate("/customer/orders")} className="hover:text-foreground transition">Pedidos</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Parceiros</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/register-restaurant")} className="hover:text-foreground transition">Restaurantes</button></li>
                <li><button onClick={() => navigate("/register-driver")} className="hover:text-foreground transition">Motoristas</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-xs md:text-sm text-muted-foreground">
            <p>&copy; 2025 FoodFlow. Todos os direitos reservados. | <a href="#" className="hover:text-foreground transition">Privacidade</a> | <a href="#" className="hover:text-foreground transition">Termos</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
