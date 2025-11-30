import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, CreditCard, Loader2, Map } from "lucide-react";
import { toast } from "sonner";
import AddressSelector from "@/components/AddressSelector";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get cart from localStorage or state management
  const [cart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Form state
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryType: "delivery" as "delivery" | "pickup",
    deliveryAddress: "",
    addressReference: "",
    orderNotes: "",
    paymentMethod: "cash" as "cash" | "card" | "pix" | "online",
  });

  const { data: restaurant } = trpc.restaurant.getActive.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const deliveryFee = formData.deliveryType === "delivery" ? (restaurant?.settings?.deliveryFee || 500) : 0;
  const total = cartTotal + deliveryFee;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho antes de finalizar");
      return;
    }

    if (!formData.customerName || !formData.customerPhone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.deliveryType === "delivery" && !formData.deliveryAddress) {
      toast.error("Informe o endereço de entrega");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrderMutation.mutateAsync({
        restaurantId: restaurant?.id || 1,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        deliveryAddress: formData.deliveryAddress,
        addressReference: formData.addressReference,
        orderNotes: formData.orderNotes,
        paymentMethod: formData.paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      });

      // Clear cart
      localStorage.removeItem("cart");

      // Generate WhatsApp message
      const whatsappNumber = restaurant?.settings?.whatsappNumber || "5587999480699";
      const orderMessage = generateWhatsAppMessage(result.orderNumber, formData, cart, total);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

      // Redirect to WhatsApp automatically
      window.location.href = whatsappUrl;
    } catch (error) {
      toast.error("Erro ao criar pedido. Tente novamente mais tarde");
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppMessage = (
    orderNumber: string,
    data: typeof formData,
    items: CartItem[],
    totalAmount: number
  ) => {
    let message = `🛒 *NOVO PEDIDO* #${orderNumber}\n\n`;
    message += `👤 *Cliente:* ${data.customerName}\n`;
    message += `📱 *Telefone:* ${data.customerPhone}\n`;
    message += `📍 *Endereço:* ${data.deliveryAddress}\n`;
    if (data.addressReference) {
      message += `🏠 *Referência:* ${data.addressReference}\n`;
    }
    message += `\n*ITENS DO PEDIDO:*\n`;
    items.forEach((item) => {
      message += `\n• ${item.quantity}x ${item.productName}\n`;
      message += `  ${formatPrice(item.unitPrice)} cada\n`;
    });
    message += `\n*RESUMO:*\n`;
    message += `Subtotal: ${formatPrice(cartTotal)}\n`;
    message += `Taxa de entrega: ${formatPrice(deliveryFee)}\n`;
    message += `*TOTAL: ${formatPrice(totalAmount)}*\n\n`;
    message += `💳 *Pagamento:* ${
      data.paymentMethod === "cash"
        ? "Dinheiro"
        : data.paymentMethod === "card"
        ? "Cartão"
        : data.paymentMethod === "pix"
        ? "PIX"
        : "Online"
    }\n`;
    if (data.orderNotes) {
      message += `\n📝 *Observações:* ${data.orderNotes}`;
    }
    return message;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Carrinho vazio</h2>
          <p className="text-muted-foreground mb-6">
            Adicione produtos ao carrinho para continuar
          </p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao cardápio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Finalizar Pedido</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(87) 99999-9999"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={formData.deliveryType === "delivery" ? "default" : "outline"}
                      className="h-20"
                      onClick={() => setFormData({ ...formData, deliveryType: "delivery" })}
                    >
                      <div className="text-center">
                        <MapPin className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-semibold">Entrega</div>
                        <div className="text-xs opacity-80">{formatPrice(restaurant?.settings?.deliveryFee || 500)}</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.deliveryType === "pickup" ? "default" : "outline"}
                      className="h-20"
                      onClick={() => setFormData({ ...formData, deliveryType: "pickup" })}
                    >
                      <div className="text-center">
                        <MapPin className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-semibold">Retirar</div>
                        <div className="text-xs opacity-80">Grátis</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address or Pickup Location */}
              {formData.deliveryType === "delivery" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="address">Endereço Completo *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                      >
                        <Map className="h-4 w-4 mr-2" />
                        {showMap ? "Ocultar" : "Selecionar no"} Mapa
                      </Button>
                    </div>
                    
                    {showMap ? (
                      <AddressSelector
                        initialAddress={formData.deliveryAddress}
                        onAddressSelect={(address) => {
                          setFormData({
                            ...formData,
                            deliveryAddress: address.formatted,
                          });
                        }}
                      />
                    ) : (
                      <Textarea
                        id="address"
                        placeholder="Rua, número, bairro, cidade"
                        value={formData.deliveryAddress}
                        onChange={(e) =>
                          setFormData({ ...formData, deliveryAddress: e.target.value })
                        }
                        required
                        rows={3}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="reference">Ponto de Referência</Label>
                    <Input
                      id="reference"
                      placeholder="Ex: Próximo ao mercado"
                      value={formData.addressReference}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          addressReference: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Local de Retirada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-semibold mb-2">{restaurant?.businessName}</p>
                      <p className="text-sm text-muted-foreground">
                        {restaurant?.settings?.address || "Rua João Pessoa, 123 - Centro, Ouricuri - PE"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Retire seu pedido no local após a confirmação
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão na Entrega</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="online">Pagamento Online</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Alguma observação sobre o pedido?"
                    value={formData.orderNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, orderNotes: e.target.value })
                    }
                    rows={3}
                  />
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    "Finalizar Pedido"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Ao finalizar, você será redirecionado para o WhatsApp
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
