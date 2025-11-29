import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Star, ArrowLeft, TrendingUp } from 'lucide-react';
import type { Rating } from '@shared/schema';

export default function RestaurantRatings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState({
    avgRestaurantRating: 0,
    avgFoodRating: 0,
    avgDeliveryTime: 0,
    totalRatings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== 'restaurant_owner') {
        navigate('/login');
        return;
      }
      loadRatings();
    } catch (error) {
      navigate('/login');
    }
  }, []);

  const loadRatings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const result = await apiRequest('GET', `/api/ratings/restaurant/${user.tenantId}`);
      const ratingsData = Array.isArray(result) ? result : [];
      setRatings(ratingsData);

      // Calculate stats
      if (ratingsData.length > 0) {
        const avgRestaurant = ratingsData.filter(r => r.restaurantRating).reduce((sum, r) => sum + r.restaurantRating, 0) / ratingsData.filter(r => r.restaurantRating).length;
        const avgFood = ratingsData.filter(r => r.foodRating).reduce((sum, r) => sum + r.foodRating, 0) / ratingsData.filter(r => r.foodRating).length;
        const avgDelivery = ratingsData.filter(r => r.deliveryTime).reduce((sum, r) => sum + r.deliveryTime, 0) / ratingsData.filter(r => r.deliveryTime).length;

        setStats({
          avgRestaurantRating: Math.round(avgRestaurant * 10) / 10,
          avgFoodRating: Math.round(avgFood * 10) / 10,
          avgDeliveryTime: Math.round(avgDelivery),
          totalRatings: ratingsData.length,
        });
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
      toast({ title: 'Erro ao carregar avaliações', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return '—';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4" data-testid="page-restaurant-ratings">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/restaurant/dashboard')} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Avaliações & Feedback</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando avaliações...</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Avaliações</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-total-ratings">{stats.totalRatings}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Restaurante</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-restaurant">{stats.avgRestaurantRating.toFixed(1)}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Comida</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-food">{stats.avgFoodRating.toFixed(1)}</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Tempo Médio</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-delivery-time">{stats.avgDeliveryTime}m</div>
              </Card>
            </div>

            {/* Ratings List */}
            {ratings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma avaliação recebida ainda</div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id} className="p-4" data-testid={`card-rating-${rating.id}`}>
                    <div className="space-y-3">
                      {/* Restaurante */}
                      {rating.restaurantRating && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">Avaliação do Restaurante</span>
                            <span data-testid={`text-restaurant-rating-${rating.id}`}>{renderStars(rating.restaurantRating)}</span>
                          </div>
                          {rating.restaurantComment && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-restaurant-comment-${rating.id}`}>
                              {rating.restaurantComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Comida */}
                      {rating.foodRating && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">Avaliação da Comida</span>
                            <span data-testid={`text-food-rating-${rating.id}`}>{renderStars(rating.foodRating)}</span>
                          </div>
                          {rating.foodComment && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-food-comment-${rating.id}`}>
                              {rating.foodComment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Driver */}
                      {rating.driverRating && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">Avaliação do Entregador</span>
                            <span data-testid={`text-driver-rating-${rating.id}`}>{renderStars(rating.driverRating)}</span>
                          </div>
                          {rating.driverComment && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-driver-comment-${rating.id}`}>
                              {rating.driverComment}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t text-xs text-muted-foreground" data-testid={`text-date-${rating.id}`}>
                        {new Date(rating.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
