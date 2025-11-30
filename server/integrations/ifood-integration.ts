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
        subtotal: order.subtotal ? String(order.subtotal) : String(parseFloat(order.total) * 0.85),
        deliveryFee: order.deliveryFee ? String(order.deliveryFee) : "0",
        total: String(parseFloat(order.total)),
        status: 'pending',
        deliveryAddress: order.deliveryAddress || '',
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerEmail: order.customer.email || '',
        externalOrderId: order.id,
        externalPlatform: 'ifood',
      });

      // Create order items separately if items exist
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          await storage.createOrderItem({
            orderId: newOrder.id,
            productId: 'ifood-' + item.id,
            quantity: item.quantity,
            price: String(parseFloat(item.price)),
            name: item.name,
          }).catch(() => null);
        }
      }

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
