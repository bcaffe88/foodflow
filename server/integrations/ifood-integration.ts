import type { IStorage } from '../storage';

export async function handleIFoodWebhook(
  payload: any,
  tenantId: string,
  storage: IStorage
): Promise<{ success: boolean; orderId?: string }> {
  try {
    const { event, order } = payload;

    if (event === 'order.created') {
      const newOrder = await storage.createOrder({
        tenantId,
        customerId: 'ifood-' + order.customer.phone,
        items: order.items.map((item: any) => ({
          productId: 'ifood-' + item.id,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        totalPrice: parseFloat(order.total),
        status: 'pending',
        deliveryAddress: order.deliveryAddress || '',
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        externalOrderId: order.id,
        externalSource: 'ifood',
      });

      return { success: true, orderId: newOrder.id };
    }

    if (event === 'order.confirmed') {
      // Handle order confirmation
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('[iFood] Webhook error:', error);
    return { success: false };
  }
}
