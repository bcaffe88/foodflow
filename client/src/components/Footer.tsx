import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function Footer() {
  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(
      "Olá! Gostaria de informações sobre o serviço de entrega de comida."
    );
    window.open(
      `https://wa.me/5511999999999?text=${message}`,
      "_blank"
    );
  };

  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold mb-4">Sobre Nós</h3>
            <p className="text-sm text-muted-foreground">
              Plataforma de entrega de comida conectando restaurantes, motoristas e clientes.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold mb-4">Links Úteis</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/register-restaurant" className="text-muted-foreground hover:text-primary">Seja Parceiro</a></li>
              <li><a href="/register-driver" className="text-muted-foreground hover:text-primary">Trabalhe Conosco</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary">Termos de Uso</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary">Política de Privacidade</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contato</h3>
            <p className="text-sm text-muted-foreground mb-3">
              (11) 99999-9999
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleContactWhatsApp}
              className="w-full"
              data-testid="button-contact-whatsapp"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar Conosco
            </Button>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold mb-4">Redes Sociais</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href="#" data-testid="link-facebook">f</a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="#" data-testid="link-instagram">📷</a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="#" data-testid="link-twitter">𝕏</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; 2025 Food Delivery. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">Privacidade</a>
            <a href="#" className="hover:text-primary">Termos</a>
            <a href="#" className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
