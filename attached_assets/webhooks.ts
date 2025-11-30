import { Router } from "express";
import { getDb } from "./db";
import { orders, orderItems, products } from "../drizzle/schema";

const router = Router();

/**
 * Normaliza pedido do iFood para o formato do sistema
 */
function normalizeIfoodOrder(rawOrder: any) {
  return {
    externalOrderId: rawOrder.id || rawOrder.orderId,
    source: "ifood",
    customerName: rawOrder.customer?.name || rawOrder.cliente?.nome || "Cliente iFood",
    customerPhone: rawOrder.customer?.phone || rawOrder.cliente?.telefone || "",
    customerEmail: rawOrder.customer?.email || null,
    deliveryAddress: rawOrder.delivery?.address || rawOrder.endereco || "Endereço não informado",
    deliveryType: rawOrder.delivery?.mode === "TAKEOUT" ? "pickup" : "delivery",
    paymentMethod: rawOrder.payments?.[0]?.method || "online",
    total: Math.round((rawOrder.total || rawOrder.valor_total || 0) * 100), // Convert to cents
    items: rawOrder.items || rawOrder.itens || [],
    notes: rawOrder.observations || rawOrder.observacoes || "",
  };
}

/**
 * Normaliza pedido do Uber Eats para o formato do sistema
 */
function normalizeUberEatsOrder(rawOrder: any) {
  return {
    externalOrderId: rawOrder.id || rawOrder.order_id,
    source: "ubereats",
    customerName: rawOrder.eater?.first_name || "Cliente Uber Eats",
    customerPhone: rawOrder.eater?.phone || "",
    customerEmail: rawOrder.eater?.email || null,
    deliveryAddress: rawOrder.delivery?.location?.address || "Endereço não informado",
    deliveryType: rawOrder.type === "PICK_UP" ? "pickup" : "delivery",
    paymentMethod: "online",
    total: Math.round((rawOrder.payment?.charges?.total || 0) * 100),
    items: rawOrder.cart?.items || [],
    notes: rawOrder.special_instructions || "",
  };
}

/**
 * Webhook para receber pedidos do iFood
 */
router.post("/ifood", async (req, res) => {
  try {
    const rawOrder = req.body;
    console.log("[Webhook iFood] Pedido recebido:", JSON.stringify(rawOrder, null, 2));

    const normalized = normalizeIfoodOrder(rawOrder);
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Gerar número do pedido
    const orderNumber = `IF-${Date.now().toString().slice(-8)}`;

    // Criar pedido no banco
    const [order] = await db.insert(orders).values({
      restaurantId: 1, // TODO: Identificar restaurante correto
      orderNumber,
      customerName: normalized.customerName,
      customerPhone: normalized.customerPhone,
      customerEmail: normalized.customerEmail,
      deliveryAddress: normalized.deliveryAddress,
      deliveryType: normalized.deliveryType as "delivery" | "pickup",
      paymentMethod: "online",
      paymentStatus: "paid",
      status: "pending",
      source: normalized.source,
      externalOrderId: normalized.externalOrderId,
      subtotal: normalized.total,
      deliveryFee: 0,
      total: normalized.total,
      orderNotes: normalized.notes,
    });

    // TODO: Criar items do pedido
    // Isso requer mapear produtos externos para produtos locais

    console.log(`[Webhook iFood] Pedido ${orderNumber} criado com sucesso`);

    res.status(200).json({
      success: true,
      message: "Pedido iFood recebido com sucesso",
      orderNumber,
    });
  } catch (error) {
    console.error("[Webhook iFood] Erro:", error);
    res.status(500).json({ error: "Erro ao processar pedido" });
  }
});

/**
 * Webhook para receber pedidos do Uber Eats
 */
router.post("/ubereats", async (req, res) => {
  try {
    const rawOrder = req.body;
    console.log("[Webhook Uber Eats] Pedido recebido:", JSON.stringify(rawOrder, null, 2));

    const normalized = normalizeUberEatsOrder(rawOrder);
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Gerar número do pedido
    const orderNumber = `UE-${Date.now().toString().slice(-8)}`;

    // Criar pedido no banco
    await db.insert(orders).values({
      restaurantId: 1,
      orderNumber,
      customerName: normalized.customerName,
      customerPhone: normalized.customerPhone,
      customerEmail: normalized.customerEmail,
      deliveryAddress: normalized.deliveryAddress,
      deliveryType: normalized.deliveryType as "delivery" | "pickup",
      paymentMethod: "online",
      paymentStatus: "paid",
      status: "pending",
      source: normalized.source,
      externalOrderId: normalized.externalOrderId,
      subtotal: normalized.total,
      deliveryFee: 0,
      total: normalized.total,
      orderNotes: normalized.notes,
    });

    console.log(`[Webhook Uber Eats] Pedido ${orderNumber} criado com sucesso`);

    res.status(200).json({
      success: true,
      message: "Pedido Uber Eats recebido com sucesso",
      orderNumber,
    });
  } catch (error) {
    console.error("[Webhook Uber Eats] Erro:", error);
    res.status(500).json({ error: "Erro ao processar pedido" });
  }
});

/**
 * Webhook genérico para outras plataformas
 */
router.post("/generic", async (req, res) => {
  try {
    const { source, ...rawOrder } = req.body;
    console.log(`[Webhook ${source}] Pedido recebido:`, JSON.stringify(rawOrder, null, 2));

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const orderNumber = `EXT-${Date.now().toString().slice(-8)}`;

    await db.insert(orders).values({
      restaurantId: 1,
      orderNumber,
      customerName: rawOrder.customerName || "Cliente Externo",
      customerPhone: rawOrder.customerPhone || "",
      customerEmail: rawOrder.customerEmail || null,
      deliveryAddress: rawOrder.deliveryAddress || "Endereço não informado",
      deliveryType: (rawOrder.deliveryType as "delivery" | "pickup") || "delivery",
      paymentMethod: "online",
      paymentStatus: "paid",
      status: "pending",
      source: source || "external",
      externalOrderId: rawOrder.externalOrderId,
      subtotal: rawOrder.total || 0,
      deliveryFee: 0,
      total: rawOrder.total || 0,
      orderNotes: rawOrder.notes || "",
    });

    res.status(200).json({
      success: true,
      message: `Pedido ${source} recebido com sucesso`,
      orderNumber,
    });
  } catch (error) {
    console.error("[Webhook Generic] Erro:", error);
    res.status(500).json({ error: "Erro ao processar pedido" });
  }
});

export default router;


/**
 * Webhook para enviar pedidos para impressora térmica
 */
router.post("/printer", async (req, res) => {
  try {
    const { orderNumber, customerName, items, total, source } = req.body;

    // Formatar para impressora térmica (80mm)
    const printLines = [
      "================================",
      "         NOVO PEDIDO",
      "================================",
      "",
      `Pedido: ${orderNumber}`,
      `Plataforma: ${source || "Site"}`,
      `Cliente: ${customerName}`,
      `Data: ${new Date().toLocaleString("pt-BR")}`,
      "",
      "ITENS:",
      "--------------------------------",
    ];

    items.forEach((item: any) => {
      printLines.push(`${item.quantity}x ${item.name}`);
      if (item.notes) {
        printLines.push(`   OBS: ${item.notes}`);
      }
    });

    printLines.push("--------------------------------");
    printLines.push(`TOTAL: R$ ${(total / 100).toFixed(2)}`);
    printLines.push("");
    printLines.push("================================");

    const printContent = printLines.join("\n");

    // Enviar para API de impressora (webhook)
    const printerWebhookUrl = process.env.PRINTER_WEBHOOK_URL;

    if (printerWebhookUrl) {
      try {
        const response = await fetch(printerWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PRINTER_API_KEY || ""}`,
          },
          body: JSON.stringify({
            action: "print",
            content: printContent,
            copies: 1,
            paperSize: "80mm",
          }),
        });

        if (response.ok) {
          console.log(`[Printer] Pedido ${orderNumber} enviado para impressao`);
          return res.status(200).json({
            success: true,
            message: "Pedido enviado para impressora",
          });
        }
      } catch (fetchError) {
        console.warn("[Printer] Falha ao conectar ao webhook:", fetchError);
      }
    }

    // Se nao tiver webhook configurado, apenas log
    console.log(`[Printer] Pedido ${orderNumber} pronto para impressao`);
    res.status(200).json({
      success: true,
      message: "Pedido formatado para impressao",
      content: printContent,
    });
  } catch (error) {
    console.error("[Printer] Erro:", error);
    res.status(500).json({ error: "Erro ao enviar para impressora" });
  }
});
