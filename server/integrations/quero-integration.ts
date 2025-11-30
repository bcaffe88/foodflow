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
        subtotal: order.subtotal ? String(order.subtotal) : String(parseFloat(order.total || 0) * 0.85),
        deliveryFee: order.deliveryFee ? String(order.deliveryFee) : "0",
        total: String(parseFloat(order.total || 0)),
        status: 'pending',
        deliveryAddress: order.deliveryAddress || '',
        customerName: order.customer?.name || 'Quero Delivery Customer',
        customerPhone: order.customer?.phone || '',
        customerEmail: order.customer?.email || '',
        externalOrderId: order.id,
        externalPlatform: 'quero',
      });

      // Create order items separately if items exist
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          await storage.createOrderItem({
            orderId: newOrder.id,
            productId: 'quero-' + item.id,
            quantity: item.quantity || 1,
            price: String(parseFloat(item.price || 0)),
            name: item.name,
          }).catch(() => null);
        }
      }

      return { success: true, orderId: newOrder.id };
    }

    return { success: true };
  } catch (error) {
    console.error('[Quero] Webhook error:', error);
    return { success: false };
  }
}
