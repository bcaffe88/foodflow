import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, DollarSign, Truck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrderPlacementPage() {
  const location = useLocation();
  const [, navigate] = location;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  
  // Get cart data from URL
  const params = new URLSearchParams(location[0].split("?")[1]);
  const restaurantId = params.get("restaurantId") || "";
  const restaurantName = params.get("restaurantName") || "";
  const itemsJson = params.get("items") || "[]";
  const subtotal = parseFloat(params.get("subtotal") || "0");
  const deliveryFee = params.get("deliveryType") === "pickup" ? "0" : (params.get("deliveryFee") || "5");
  
  let items = [];
  try {
    items = JSON.parse(decodeURIComponent(itemsJson));
  } catch (e) {
    items = [];
  }
  
  const total = subtotal + parseFloat(deliveryFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (!customerPhone.trim()) {
      toast({ title: "Telefone obrigatório", variant: "destructive" });
      return;
    }
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Endereço obrigatório para entrega", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      // Create order first
      const order = await apiRequest("POST", "/api/customer/orders", {
        restaurantId,
        items,
        deliveryAddress: deliveryType === "pickup" ? restaurantName : deliveryAddress,
        orderNotes: notes,
      });

      // If payment is card/pix, go to checkout
      if (paymentMethod === "card" || paymentMethod === "pix") {
        navigate(`/checkout?orderId=${order.id}&total=${total}&customerName=${encodeURIComponent(customerName)}&customerPhone=${encodeURIComponent(customerPhone)}&paymentMethod=${paymentMethod}`);
      } else {
        // If cash, confirm order and open WhatsApp
        await apiRequest("POST", "/api/orders/confirm-with-whatsapp", {
          orderId: order.id,
          customerName,
          customerPhone,
          paymentMethod: "cash",
          restaurantId,
        });
        toast({ title: "Pedido criado!", description: "WhatsApp será aberto em breve..." });
        navigate(`/order-confirmation?orderId=${order.id}`);
      }
    } catch (error: any) {
      toast({ 
        title: "Erro ao criar pedido", 
        description: error?.message || "Tente novamente",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Resumo do Pedido</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 md:p-8">
              {/* Itens do pedido */}
              <div className="mb-6 pb-6 border-b">
                <h2 className="text-lg font-semibold mb-4" data-testid="text-order-items">Itens do Pedido</h2>
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm" data-testid={`item-${item.productId}`}>
                      <span>{item.quantity}x {item.name}</span>
                      <span className="text-muted-foreground">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>R$ {deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t">
                    <span data-testid="text-total">Total:</span>
                    <span data-testid="value-total">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados do cliente */}
                <div className="space-y-4">
                  <h3 className="font-semibold" data-testid="text-customer-info">Seus Dados</h3>
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Seu nome completo"
                      data-testid="input-customer-name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone com WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(87) 99948-0699"
                      data-testid="input-customer-phone"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2" data-testid="text-delivery-type">
                    <Truck className="h-4 w-4" />
                    Tipo de Entrega
                  </h3>
                  <Select value={deliveryType} onValueChange={setDeliveryType}>
                    <SelectTrigger data-testid="select-delivery-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega (R$ {deliveryFee})</SelectItem>
                      <SelectItem value="pickup">Retirada (Grátis)</SelectItem>
                    </SelectContent>
                  </Select>

                  {deliveryType === "delivery" && (
                    <div>
                      <Label htmlFor="address">Endereço de Entrega *</Label>
                      <Input
                        id="address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Rua, número, bairro"
                        data-testid="input-delivery-address"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Método de pagamento */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2" data-testid="text-payment-method">
                    <DollarSign className="h-4 w-4" />
                    Método de Pagamento
                  </h3>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro na Entrega</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="card">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Alguma observação sobre seu pedido?"
                    data-testid="textarea-notes"
                    className="mt-1 w-full min-h-20 p-2 border rounded-md text-sm"
                  />
                </div>

                {/* Botão de confirmação */}
                <Button
                  type="submit"
                  disabled={isLoading || !items.length}
                  className="w-full"
                  data-testid="button-confirm-order"
                >
                  {isLoading ? "Processando..." : `Confirmar Pedido - R$ ${total.toFixed(2)}`}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
