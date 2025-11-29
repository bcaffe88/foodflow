import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { AddressSelector } from "@/components/address-selector";
import { CreditCard, ArrowLeft, MapPin } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : Promise.resolve(null);

function CheckoutForm({
  clientSecret,
  orderId,
}: {
  clientSecret: string;
  orderId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const handleAddressSelect = async (address: any) => {
    try {
      await apiRequest("PATCH", `/api/orders/${orderId}/update`, {
        deliveryAddress: address.address,
        addressLatitude: address.latitude,
        addressLongitude: address.longitude,
        addressReference: address.reference,
      });
      setSelectedAddress(address);
      toast({
        title: "Endereço salvo",
        description: "Localização confirmada para entrega",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar endereço",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!selectedAddress) {
      toast({
        title: "Endereço obrigatório",
        description: "Por favor, selecione um endereço de entrega",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
        },
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço de Entrega
        </label>
        <AddressSelector
          onAddressSelect={handleAddressSelect}
          placeholder="Digite seu endereço..."
          value={selectedAddress?.address || ""}
          data-testid="input-address"
        />
        {selectedAddress && (
          <p className="text-xs text-green-600 mt-2" data-testid="status-address-confirmed">✓ Endereço confirmado</p>
        )}
      </div>
      
      <div>
        <label className="text-xs md:text-sm font-medium mb-2 block">Dados do Cartão</label>
        <PaymentElement />
      </div>
      
      <Button
        type="submit"
        className="w-full text-xs md:text-sm"
        disabled={!stripe || !elements || isLoading || !selectedAddress}
        data-testid="button-pay"
      >
        {isLoading ? "Processando..." : "Confirmar Pagamento"}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const location = useLocation();
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast({ title: "Erro", description: "Faça login para continuar", variant: "destructive" });
      navigate("/login");
      return;
    }

    const params = new URLSearchParams(location[0].split("?")[1]);
    const orderIdParam = params.get("orderId");
    const totalParam = params.get("total");

    if (orderIdParam && totalParam) {
      setOrderId(orderIdParam);
      createPaymentIntent(orderIdParam, parseFloat(totalParam));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleGoBack = () => {
    navigate("/");
  };

  const createPaymentIntent = async (orderId: string, amount: number) => {
    try {
      const response = await apiRequest("POST", "/api/payments/create-intent", {
        orderId,
        amount,
        paymentMethods: ["card"],
      });

      setClientSecret(response.clientSecret || `pi_mock_${Date.now()}`);
    } catch (error) {
      console.error("Payment intent error:", error);
      toast({
        title: "Aviso",
        description: "Usando modo de pagamento simplificado",
      });
      setClientSecret(`pi_mock_${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <h1 className="text-xl font-bold mb-4">Erro ao processar</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível criar a sessão de pagamento
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            data-testid="button-back"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Finalizar Pagamento</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="p-6 md:p-8">
            <p className="text-muted-foreground text-center mb-6 text-xs md:text-sm">Preencha seus dados para confirmar o pedido</p>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
            </Elements>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
