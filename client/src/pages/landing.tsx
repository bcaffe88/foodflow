import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Utensils, Bike, ShoppingCart, TrendingUp, Users, Zap, CheckCircle, Shield, Clock } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  // SEO Meta Tags
  useEffect(() => {
    document.title = "FoodFlow - Plataforma de Delivery de Comida | Rápido e Confiável";
    document.documentElement.lang = "pt-BR";

    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setOGTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    setMetaTag("description", "Plataforma completa de delivery que conecta clientes, restaurantes e motoristas. Peça suas refeições favoritas e receba em minutos. Seguro, rápido e confiável.");
    setMetaTag("keywords", "delivery, comida, restaurante, motorista, entrega, pedidos online");
    setMetaTag("viewport", "width=device-width, initial-scale=1.0");
    
    setOGTag("og:title", "FoodFlow - Plataforma de Delivery");
    setOGTag("og:description", "A forma mais rápida e segura de pedir comida online");
    setOGTag("og:type", "website");
    setOGTag("og:image", "https://cdn.placeholder.com/og-image.png");
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-50/20 dark:to-red-950/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-red-600"
            data-testid="text-logo"
          >
            FoodFlow
          </motion.div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              data-testid="button-login"
            >
              Entrar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => navigate("/register")}
              data-testid="button-signup"
            >
              Começar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Comida Rápida, Entregue Ainda Mais Rápido
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          A plataforma completa de delivery que conecta clientes, restaurantes e motoristas. 
          Peça suas refeições favoritas e receba em minutos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 justify-center mb-12 flex-wrap"
        >
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => navigate("/restaurants")}
            data-testid="button-explore"
          >
            Explorar Restaurantes
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/register-restaurant")}
            data-testid="button-partner"
          >
            Seja um Parceiro
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16"
        >
          {[
            { value: "500+", label: "Restaurantes Ativos" },
            { value: "50K+", label: "Clientes Satisfeitos" },
            { value: "30 min", label: "Tempo Médio de Entrega" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-bold text-red-600">{stat.value}</p>
              <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16"
        >
          Como Funciona
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {[
            { step: "1", icon: ShoppingCart, title: "Escolha", description: "Procure seu restaurante favorito" },
            { step: "2", icon: Utensils, title: "Comida", description: "Selecione seus pratos preferidos" },
            { step: "3", icon: Clock, title: "Entrega", description: "Acompanhe em tempo real" },
            { step: "4", icon: CheckCircle, title: "Aproveite", description: "Receba e desfrute" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="relative"
            >
              <Card className="p-6 text-center h-full hover-elevate">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-600/10 mb-4">
                  <item.icon className="h-6 w-6 text-red-600" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16"
        >
          Por Que Escolher FoodFlow?
        </motion.h2>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { icon: ShoppingCart, title: "Pedidos Fáceis", desc: "Interface intuitiva para buscar, comparar e pedir suas refeições favoritas" },
            { icon: Bike, title: "Entrega Rápida", desc: "Rastreamento em tempo real e motoristas verificados" },
            { icon: Utensils, title: "Variedade", desc: "Centenas de restaurantes com culinária de todas as culturas" },
            { icon: TrendingUp, title: "Oportunidades", desc: "Para restaurantes e motoristas crescerem seus negócios" },
            { icon: Users, title: "Comunidade", desc: "Faça parte de uma rede crescente de amantes de comida" },
            { icon: Zap, title: "Tecnologia", desc: "Plataforma moderna com múltiplas formas de pagamento seguro" },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
            >
              <Card className="p-6 h-full hover-elevate">
                <feature.icon className="h-10 w-10 text-red-600 mb-4" />
                <h3 className="font-bold mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {[
            { icon: Shield, label: "SSL Certificado", value: "Segurança 100%" },
            { icon: Users, label: "Clientes Verificados", value: "2M+ Usuários" },
            { icon: CheckCircle, label: "Avaliação Média", value: "4.8/5 ⭐" },
          ].map((proof, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="text-center"
            >
              <proof.icon className="h-12 w-12 text-red-600 mx-auto mb-3" />
              <p className="text-xs md:text-sm text-muted-foreground mb-1">{proof.label}</p>
              <p className="text-lg md:text-xl font-bold">{proof.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8 md:p-12 bg-red-600/5 border-red-200 dark:border-red-900">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">
              Escolha sua jornada conosco. Seja cliente, restaurante ou motorista.
            </p>
            <div className="flex gap-3 md:gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 flex-1 md:flex-none min-w-[140px]"
                onClick={() => navigate("/restaurants")}
                data-testid="button-order-now"
              >
                Pedir Agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 md:flex-none min-w-[140px]"
                onClick={() => navigate("/register-driver")}
                data-testid="button-drive"
              >
                Seja Motorista
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 md:flex-none min-w-[140px]"
                onClick={() => navigate("/register-restaurant")}
                data-testid="button-register-restaurant-landing"
              >
                Abra um Restaurante
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs md:text-sm text-muted-foreground">
          <p>&copy; 2025 FoodFlow. Todos os direitos reservados. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}
