import type { IStorage } from '../storage';

export async function handleQueroDeliveryWebhook(
  payload: any,
  tenantId: string,
  storage: IStorage
): Promise<{ success: boolean; orderId?: string }> {
  try {
    const { event, order } = payload;

    if (event === 'order.created' || event === 'order.placed') {
      const newOrder = await storage.createOrder({
        tenantId,
        customerId: 'quero-' + order.customer?.id,
        items: order.items?.map((item: any) => ({
          productId: 'quero-' + item.id,
          quantity: item.quantity || 1,
          price: parseFloat(item.price || 0),
        })) || [],
        totalPrice: parseFloat(order.total || 0),
        status: 'pending',
        deliveryAddress: order.deliveryAddress || '',
        customerName: order.customer?.name || 'Quero Delivery Customer',
        customerPhone: order.customer?.phone || '',
        externalOrderId: order.id,
        externalSource: 'quero',
      });

      return { success: true, orderId: newOrder.id };
    }

    return { success: true };
  } catch (error) {
    console.error('[Quero] Webhook error:', error);
    return { success: false };
  }
}
