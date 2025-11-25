import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { CheckCircle, MapPin, Phone, Clock, MessageCircle } from "lucide-react";
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
  const location = useLocation();
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
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <CheckCircle className="w-20 h-20 text-secondary" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu pedido foi recebido com sucesso
          </p>
        </div>

        {orderDetails && (
          <Card className="p-6 space-y-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Número do Pedido</p>
              <p className="font-mono font-bold text-lg">{orderId || "Carregando..."}</p>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{orderDetails.customerPhone}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                  <p className="font-medium">{orderDetails.deliveryAddress}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                  <p className="font-medium">{orderDetails.estimatedTime}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total</p>
              <p className="text-2xl font-bold text-secondary">R$ {orderDetails.total}</p>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              A confirmação será enviada para o WhatsApp do restaurante
            </p>
          </div>

          {whatsappUrl && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                window.open(whatsappUrl, "_blank");
                setWhatsappOpened(true);
              }}
              data-testid="button-open-whatsapp"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Confirmar no WhatsApp
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/"}
            data-testid="button-continue-shopping"
          >
            Voltar ao Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
