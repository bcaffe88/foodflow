import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MapAddressInput from "@/components/MapAddressInput";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { CartItem } from "@shared/schema";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : Promise.resolve(null);

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(10, "Endereço deve ser mais detalhado"),
  addressLatitude: z.string().optional(),
  addressLongitude: z.string().optional(),
  orderNotes: z.string().optional(),
  addressReference: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  total?: number;
  paymentMethod?: string;
  onPaymentMethodChange?: (method: string) => void;
  deliveryType?: string;
  onDeliveryTypeChange?: (type: string) => void;
  onSubmit: (data: CheckoutFormData & { subtotal: string; deliveryFee: string; total: string; paymentIntentId?: string }) => void;
  restaurantSlug?: string;
}

function StripePaymentForm({ 
  total, 
  onSuccess, 
  onError,
  paymentMethod
}: { 
  total: number; 
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  paymentMethod: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}` },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Erro ao processar pagamento");
      } else if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={isProcessing} className="w-full">
        {isProcessing ? "Processando..." : `Pagar R$ ${total.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function CheckoutDialog({
  open,
  onOpenChange,
  items,
  total: totalProp,
  paymentMethod = "pix",
  onPaymentMethodChange,
  deliveryType = "delivery",
  onDeliveryTypeChange,
  onSubmit,
  restaurantSlug,
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5.0;
  const total = totalProp || (subtotal + deliveryFee);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      deliveryAddress: "",
      orderNotes: "",
    },
  });

  const handleAddressChange = (address: string, lat?: string, lng?: string) => {
    form.setValue("deliveryAddress", address);
    if (lat) form.setValue("addressLatitude", lat);
    if (lng) form.setValue("addressLongitude", lng);
  };

  const handleSubmit = async (data: CheckoutFormData) => {
    setIsLoading(true);
    try {
      // Para pagamento com Stripe (Card ou PIX)
      if (paymentMethod === "card" || paymentMethod === "pix_stripe") {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            customerEmail: data.customerEmail,
            currency: "brl", // Para PIX é necessário BRL
            paymentMethods: paymentMethod === "pix_stripe" ? ["pix"] : ["card"],
          }),
        });

        if (!response.ok) throw new Error("Erro ao criar payment intent");
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        return;
      }

      // Para PIX direto, Dinheiro ou outros métodos
      onSubmit({
        ...data,
        addressLatitude: data.addressLatitude,
        addressLongitude: data.addressLongitude,
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao processar pedido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeSuccess = (paymentIntentId: string) => {
    const data = form.getValues();
    onSubmit({
      ...data,
      addressLatitude: data.addressLatitude,
      addressLongitude: data.addressLongitude,
      paymentIntentId,
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      total: total.toString(),
    });
    form.reset();
    setClientSecret(null);
    onOpenChange(false);
  };

  if (clientSecret && (paymentMethod === "card" || paymentMethod === "pix_stripe")) {
    const methodLabel = paymentMethod === "pix_stripe" ? "PIX" : "Cartão";
    const methodDescription = paymentMethod === "pix_stripe" 
      ? "Escaneie o código QR ou copie a chave PIX" 
      : "Digite seus dados de cartão";
    
    return (
      <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) setClientSecret(null); onOpenChange(newOpen); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento com {methodLabel}</DialogTitle>
            <DialogDescription>{methodDescription}</DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md mb-4">
            <p className="text-sm font-semibold">Total: R$ {total.toFixed(2)}</p>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripePaymentForm 
              total={total}
              paymentMethod={paymentMethod}
              onSuccess={handleStripeSuccess}
              onError={(error) => toast({ title: "Erro", description: error, variant: "destructive" })}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Finalizar Pedido</DialogTitle>
          <DialogDescription>Preencha seus dados de entrega e escolha o método de pagamento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                <span>Total</span>
                <span data-testid="text-checkout-total">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone/WhatsApp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <MapAddressInput
                      value={field.value}
                      onChange={handleAddressChange}
                      onLatLngChange={(lat, lng) => {
                        form.setValue("deliveryAddress", `Latitude: ${lat}, Longitude: ${lng}`);
                      }}
                    />
                    {!field.value && <FormMessage />}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Tipo de Entrega</FormLabel>
                  <select 
                    value={deliveryType}
                    onChange={(e) => onDeliveryTypeChange?.(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    data-testid="select-delivery-type"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Retirada</option>
                  </select>
                </FormItem>

                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => onPaymentMethodChange?.(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                    data-testid="select-payment-method"
                  >
                    <option value="pix">PIX (WhatsApp)</option>
                    <option value="pix_stripe">PIX (Stripe)</option>
                    <option value="card">Cartão de Crédito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </FormItem>
              </div>

              <FormField
                control={form.control}
                name="orderNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Alguma observação sobre o pedido?"
                        rows={2}
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  data-testid="button-submit-order"
                >
                  {isLoading ? "Processando..." : `Confirmar Pedido - R$ ${total.toFixed(2)}`}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Seu pedido será enviado via WhatsApp
                </p>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
