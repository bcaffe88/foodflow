import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Utensils, Bike, ShoppingCart, TrendingUp, Users, Zap, CheckCircle, Shield, Clock, Flame, Award, MapPin } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "FoodFlow - Plataforma Premium de Delivery | Experiência Sofisticada";
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
          
          <div className="flex gap-2 md:gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              data-testid="button-login"
              className="text-sm md:text-base"
            >
              Entrar
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
              onClick={() => navigate("/register")}
              data-testid="button-signup"
            >
              Começar
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
            <span className="text-sm font-medium text-primary">Entrega Premium e Segura</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Comida Excepcional,<br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Entregue com Excelência
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base md:text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          A plataforma sofisticada de delivery que une clientes, restaurantes parceiros e motoristas profissionais. Peça suas delícias e as receba em minutos, acompanhando cada entrega em tempo real com precisão.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-3 md:gap-4 justify-center mb-16 flex-wrap"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/restaurants")}
            data-testid="button-explore"
          >
            Explorar
            <Utensils className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate("/register-restaurant")}
            data-testid="button-partner"
          >
            Parceiro
            <MapPin className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mt-20 pt-12 border-t border-border/50"
        >
          {[
            { value: "5.000+", label: "Restaurantes Premium", icon: Utensils },
            { value: "500K+", label: "Clientes Satisfeitos", icon: Users },
            { value: "18 min", label: "Entrega Média", icon: Clock },
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
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
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
          className="text-3xl md:text-5xl font-bold text-center mb-16 md:mb-20"
        >
          Jornada Sofisticada
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {[
            { step: "1", icon: ShoppingCart, title: "Descobrir", description: "Explore seleção refinada de restaurantes" },
            { step: "2", icon: Utensils, title: "Selecionar", description: "Customize sua refeição perfeitamente" },
            { step: "3", icon: Bike, title: "Rastrear", description: "Acompanhe entregador ao vivo no mapa" },
            { step: "4", icon: CheckCircle, title: "Desfrutar", description: "Receba quente com qualidade garantida" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="relative"
            >
              <Card className="p-6 md:p-8 text-center h-full hover-elevate border-2 border-transparent hover:border-primary/20 transition-all group">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
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
          className="text-3xl md:text-5xl font-bold text-center mb-16 md:mb-20"
        >
          Por Que FoodFlow Diferencia?
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { icon: ShoppingCart, title: "Intuição Premiada", desc: "Interface que agrada à primeira vista" },
            { icon: Bike, title: "Velocidade Sofisticada", desc: "Rastreamento real-time profissional" },
            { icon: Utensils, title: "Seleção Refinada", desc: "Centenas de restaurantes exclusivos" },
            { icon: TrendingUp, title: "Para Restaurantes", desc: "Crescimento sustentável e lucrativo" },
            { icon: Users, title: "Comunidade Premium", desc: "Rede de apreciadores de qualidade" },
            { icon: Zap, title: "Tecnologia Avançada", desc: "Múltiplas formas de pagamento seguro" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
            >
              <Card className="p-6 md:p-8 h-full hover-elevate border-2 border-transparent hover:border-primary/20 transition-all group">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2 md:mb-3 text-base md:text-lg group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12"
        >
          {[
            { icon: Shield, label: "Segurança Certificada", value: "SSL & PCI" },
            { icon: Award, label: "Avaliação Média", value: "4.9/5 ⭐" },
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
              <p className="text-xs md:text-sm text-muted-foreground mb-2">{proof.label}</p>
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
          <Card className="p-8 md:p-16 bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 shadow-xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center leading-tight">
              Pronto para Experiência Premium?
            </h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-center text-base md:text-lg leading-relaxed">
              Junte-se a milhares de usuários discerninentes. Escolha seu papel: cliente sofisticado, restaurante exclusivo ou motorista profissional.
            </p>
            <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/restaurants")}
                data-testid="button-order-now"
              >
                Pedir Agora
                <ShoppingCart className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("/register-driver")}
                data-testid="button-drive"
              >
                Motorista
                <Bike className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="shadow-md hover:shadow-lg transition-all"
                onClick={() => navigate("/register-restaurant")}
                data-testid="button-register-restaurant-landing"
              >
                Restaurante
                <Utensils className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-b from-background to-background/50 py-12 md:py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm md:text-base">FoodFlow</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Premium Delivery</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Para Clientes</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/restaurants")} className="hover:text-foreground transition">Restaurantes</button></li>
                <li><button onClick={() => navigate("/customer/orders")} className="hover:text-foreground transition">Pedidos</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Parceiros</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/register-restaurant")} className="hover:text-foreground transition">Restaurantes</button></li>
                <li><button onClick={() => navigate("/register-driver")} className="hover:text-foreground transition">Motoristas</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Empresa</h4>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-xs md:text-sm text-muted-foreground">
            <p>&copy; 2025 FoodFlow Premium. Todos os direitos reservados. | <a href="#" className="hover:text-foreground transition">Privacidade</a> | <a href="#" className="hover:text-foreground transition">Termos</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
