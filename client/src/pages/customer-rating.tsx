import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Star, ArrowLeft } from 'lucide-react';
import type { Order } from '@shared/schema';

export default function CustomerRating() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    restaurantRating: 5,
    restaurantComment: '',
    driverRating: 5,
    driverComment: '',
    foodRating: 5,
    foodComment: '',
    deliveryTime: 0,
  });

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    if (!orderId) {
      navigate('/customer/orders');
      return;
    }
    
    const loadOrder = async () => {
      try {
        const result = await apiRequest('GET', `/api/orders/${orderId}`);
        setOrder(result);
      } catch (error) {
        console.error('Failed to load order:', error);
        toast({ title: 'Erro ao carregar pedido', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrder();
  }, []);

  const handleSubmit = async () => {
    if (!order) return;

    setIsSubmitting(true);
    try {
      const result = await apiRequest('POST', '/api/ratings', {
        orderId: order.id,
        customerId: JSON.parse(localStorage.getItem('user') || '{}').id,
        tenantId: order.tenantId,
        driverId: order.driverId,
        restaurantRating: ratings.restaurantRating,
        restaurantComment: ratings.restaurantComment,
        driverRating: ratings.driverRating,
        driverComment: ratings.driverComment,
        foodRating: ratings.foodRating,
        foodComment: ratings.foodComment,
        deliveryTime: ratings.deliveryTime,
      });

      if (result?.success) {
        toast({ title: 'Avaliação enviada com sucesso!' });
        navigate('/customer/orders');
      }
    } catch (error) {
      toast({ title: 'Erro ao enviar avaliação', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          data-testid={`button-star-${star}`}
          className="transition-all"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return <div className="p-4">Carregando pedido...</div>;
  }

  if (!order) {
    return <div className="p-4">Pedido não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4" data-testid="page-customer-rating">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer/orders')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Avaliar Pedido #{order.id.slice(0, 8)}</h1>
        </div>

        <div className="space-y-6">
          {/* Restaurante */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Avaliação do Restaurante</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Classificação (1-5)</label>
                <StarRating value={ratings.restaurantRating} onChange={(v) => setRatings({ ...ratings, restaurantRating: v })} />
              </div>
              <Textarea
                placeholder="Comentário sobre o restaurante (opcional)"
                value={ratings.restaurantComment}
                onChange={(e) => setRatings({ ...ratings, restaurantComment: e.target.value })}
                data-testid="textarea-restaurant-comment"
              />
            </div>
          </Card>

          {/* Comida */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Avaliação da Comida</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Classificação (1-5)</label>
                <StarRating value={ratings.foodRating} onChange={(v) => setRatings({ ...ratings, foodRating: v })} />
              </div>
              <Textarea
                placeholder="Como estava a comida?"
                value={ratings.foodComment}
                onChange={(e) => setRatings({ ...ratings, foodComment: e.target.value })}
                data-testid="textarea-food-comment"
              />
            </div>
          </Card>

          {/* Entrega */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Avaliação da Entrega</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Classificação do Entregador (1-5)</label>
                <StarRating value={ratings.driverRating} onChange={(v) => setRatings({ ...ratings, driverRating: v })} />
              </div>
              <Textarea
                placeholder="Como foi o serviço de entrega?"
                value={ratings.driverComment}
                onChange={(e) => setRatings({ ...ratings, driverComment: e.target.value })}
                data-testid="textarea-driver-comment"
              />
            </div>
          </Card>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-submit-rating"
              className="flex-1"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/customer/orders')}
              data-testid="button-skip-rating"
            >
              Pular
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
