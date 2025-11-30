import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, MapPin, Phone, Clock, MessageCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

interface OrderDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  total: string;
  subtotal?: string;
  deliveryFee?: string;
  estimatedTime?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  paymentMethod?: string;
  deliveryType?: string;
  orderNotes?: string;
  tenantId?: string;
}

export default function OrderConfirmationPage() {
  // Mover hooks para topo - React Hook Rules!
  const location = useLocation();
  const navigate = location[1];
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location[0].split("?")[1]);
    const id = params.get("orderId");
    if (id) {
      setOrderId(id);
      loadOrderDetails(id);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Auto-open WhatsApp quando URL está pronta
  useEffect(() => {
    if (whatsappUrl && !whatsappOpened) {
      // Aguardar um pouco para a página renderizar completamente
      const timer = setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        setWhatsappOpened(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [whatsappUrl, whatsappOpened]);

  const loadOrderDetails = async (id: string) => {
    try {
      const order = await apiRequest("GET", `/api/orders/${id}`);
      setOrderDetails({
        id: order.id || id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        estimatedTime: "30-40 minutos",
        items: order.items || [],
        paymentMethod: order.paymentMethod,
        deliveryType: order.deliveryType,
        orderNotes: order.orderNotes,
        tenantId: order.tenantId,
      });

      // Format WhatsApp message and get restaurant WhatsApp number
      if (order.tenantId) {
        await formatAndPrepareWhatsApp(order);
      }
    } catch (error) {
      // Usar dados padrão em caso de erro
      setOrderDetails({
        id: id,
        customerName: "Cliente",
        customerPhone: "N/A",
        deliveryAddress: "Em processamento...",
        total: "0.00",
        estimatedTime: "30-40 minutos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAndPrepareWhatsApp = async (order: any) => {
    try {
      // Get restaurant details for WhatsApp number
      const restaurant = await apiRequest("GET", `/api/tenants/${order.tenantId}`);
      
      const orderNumber = `ORD${order.id.slice(-8)}`;
      const itemsList = (order.items || [])
        .map((item: any) => `• ${item.quantity}x ${item.name}\n  R$ ${(item.price).toFixed(2)} cada`)
        .join("\n\n");

      const paymentLabels: { [key: string]: string } = {
        pix: "PIX",
        card: "Cartão de Crédito",
        cash: "Dinheiro",
        stripe: "Cartão de Crédito",
      };

      const deliveryLabels: { [key: string]: string } = {
        delivery: "Delivery",
        pickup: "Retirada",
      };

      const subtotal = parseFloat(order.subtotal || "0");
      const deliveryFee = parseFloat(order.deliveryFee || "0");
      const total = parseFloat(order.total || "0");

      const whatsappMessage = `🍽️ *Novo Pedido #${orderNumber}*\n\n📱 Cliente: ${order.customerName}\n📞 Telefone: ${order.customerPhone}\n📍 Endereço: ${order.deliveryAddress}\n\n📋 *Itens:*\n${itemsList}\n\n💰 Subtotal: R$ ${subtotal.toFixed(2)}\n🚗 Entrega: R$ ${deliveryFee.toFixed(2)}\n*Total: R$ ${total.toFixed(2)}*\n\n💳 Pagamento: ${paymentLabels[order.paymentMethod] || order.paymentMethod}\n\n${order.deliveryType ? `🚚 Tipo: ${deliveryLabels[order.deliveryType] || order.deliveryType}` : ""}\n${order.orderNotes ? `📝 Obs: ${order.orderNotes}` : ""}`;

      const whatsappPhone = restaurant?.whatsappPhone || "5511999999999";
      const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
      
      setWhatsappUrl(url);
    } catch (error) {
      console.error("Failed to format WhatsApp message:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold truncate">Pedido Confirmado!</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center mb-3 md:mb-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                <CheckCircle className="w-16 md:w-20 h-16 md:h-20 text-secondary" strokeWidth={1.5} />
              </motion.div>
            </div>
            <p className="text-muted-foreground text-xs md:text-sm">Seu pedido foi recebido com sucesso</p>
          </div>

          {orderDetails && (
            <Card className="p-4 md:p-6 space-y-4 md:space-y-6 mb-4 md:mb-6">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Número do Pedido</p>
                <p className="font-mono font-bold text-sm md:text-base">{orderId || "Carregando..."}</p>
              </div>

              <div className="border-t pt-4 md:pt-6 space-y-3 md:space-y-4">
                <div className="flex gap-2 md:gap-3">
                  <Phone className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium text-xs md:text-sm">{orderDetails.customerPhone}</p>
                  </div>
                </div>

                <div className="flex gap-2 md:gap-3">
                  <MapPin className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Endereço de Entrega</p>
                    <p className="font-medium text-xs md:text-sm">{orderDetails.deliveryAddress}</p>
                  </div>
                </div>

                <div className="flex gap-2 md:gap-3">
                  <Clock className="w-4 md:w-5 h-4 md:h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Tempo Estimado</p>
                    <p className="font-medium text-xs md:text-sm">{orderDetails.estimatedTime}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 md:pt-6">
                <p className="text-xs md:text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-xl md:text-2xl font-bold text-secondary" data-testid="text-total">R$ {orderDetails.total}</p>
              </div>
            </Card>
          )}

          <div className="space-y-2 md:space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 md:p-4">
              <p className="text-xs md:text-sm text-blue-900 dark:text-blue-100">Confirmação enviada para WhatsApp do restaurante</p>
            </div>

            {whatsappUrl && (
              <Button
                variant="default"
                className="w-full text-xs md:text-sm"
                onClick={() => { window.open(whatsappUrl, "_blank"); setWhatsappOpened(true); }}
                data-testid="button-open-whatsapp"
              >
                <MessageCircle className="w-3 md:w-4 h-3 md:h-4 mr-2" />
                Confirmar no WhatsApp
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full text-xs md:text-sm"
              onClick={() => navigate("/")}
              data-testid="button-continue-shopping"
            >
              Voltar ao Menu
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
