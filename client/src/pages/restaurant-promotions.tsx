import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import type { Promotion } from '@shared/schema';

export default function RestaurantPromotions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as const,
    discountValue: '',
    maxUses: '',
    minOrderValue: '',
  });

  const handleCreatePromotion = async () => {
    if (!formData.code || !formData.description || !formData.discountValue) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      const result = await apiRequest('POST', '/api/promotions/create', {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
        isActive: true,
      });

      if (result?.success) {
        toast({ title: 'Cupom criado com sucesso!' });
        setFormData({ code: '', description: '', discountType: 'percentage', discountValue: '', maxUses: '', minOrderValue: '' });
        setShowForm(false);
        loadPromotions();
      }
    } catch (error) {
      toast({ title: 'Erro ao criar cupom', variant: 'destructive' });
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      const result = await apiRequest('DELETE', `/api/promotions/${id}`);
      if (result?.success) {
        toast({ title: 'Cupom deletado' });
        loadPromotions();
      }
    } catch (error) {
      toast({ title: 'Erro ao deletar cupom', variant: 'destructive' });
    }
  };

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token) {
        navigate('/login');
        return;
      }
      const result = await apiRequest('GET', `/api/promotions/restaurant/${user.tenantId}`);
      setPromotions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4" data-testid="page-restaurant-promotions">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/restaurant/dashboard')} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Gerenciar Cupons</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-promotion">
            <Plus className="mr-2 h-4 w-4" /> Novo Cupom
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Criar Novo Cupom</h2>
            <div className="space-y-4">
              <Input placeholder="Código (ex: DESCONTO10)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} data-testid="input-code" />
              <Input placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="input-description" />
              
              <div className="flex gap-4">
                <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })} className="flex-1 px-3 py-2 border rounded-md" data-testid="select-discount-type">
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
                <Input type="number" placeholder="Valor" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} data-testid="input-discount-value" />
              </div>

              <Input type="number" placeholder="Usos Máximos (opcional)" value={formData.maxUses} onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })} data-testid="input-max-uses" />
              <Input type="number" placeholder="Pedido Mínimo (R$)" step="0.01" value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} data-testid="input-min-value" />

              <div className="flex gap-2">
                <Button onClick={handleCreatePromotion} data-testid="button-save-promotion">Salvar Cupom</Button>
                <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel">Cancelar</Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8">Carregando cupons...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum cupom criado ainda</div>
        ) : (
          <div className="grid gap-4">
            {promotions.map((promo) => (
              <Card key={promo.id} className="p-4" data-testid={`card-promotion-${promo.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg" data-testid={`text-code-${promo.id}`}>{promo.code}</h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-description-${promo.id}`}>{promo.description}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span data-testid={`text-discount-${promo.id}`}>Desconto: {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `R$ ${promo.discountValue}`}</span>
                      <span data-testid={`text-uses-${promo.id}`}>Usos: {promo.currentUses}/{promo.maxUses || '∞'}</span>
                      <span data-testid={`text-status-${promo.id}`}>{promo.isActive ? '✅ Ativo' : '❌ Inativo'}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePromotion(promo.id)} data-testid={`button-delete-${promo.id}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
