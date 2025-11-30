import type { IStorage } from '../storage';

export async function handleUberEatsWebhook(
  payload: any,
  tenantId: string,
  storage: IStorage
): Promise<{ success: boolean; orderId?: string }> {
  try {
    const { event, order } = payload;

    if (event === 'order.placed') {
      const newOrder = await storage.createOrder({
        tenantId,
        customerId: 'ubereats-' + (order.customer?.id || 'unknown'),
        items: order.items.map((item: any) => ({
          productId: 'ubereats-' + (item.id || item.name),
          quantity: item.quantity || 1,
          price: parseFloat(item.price || 0),
        })),
        totalPrice: parseFloat(order.total || 0),
        status: 'pending',
        deliveryAddress: order.deliveryAddress || '',
        customerName: order.customer?.name || 'UberEats Customer',
        customerPhone: order.customer?.phone || '',
        externalOrderId: order.id,
        externalSource: 'ubereats',
      });

      return { success: true, orderId: newOrder.id };
    }

    if (event === 'order.accepted') {
      // Update order status
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('[UberEats] Webhook error:', error);
    return { success: false };
  }
}
