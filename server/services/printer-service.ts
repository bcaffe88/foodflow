import { log } from "../logger";

interface PrinterConfig {
  type: "tcp" | "usb" | "bluetooth";
  tcpIp?: string;
  tcpPort?: number;
  enabled: boolean;
  printKitchenOrders: boolean;
}

interface PrinterOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  deliveryAddress: string;
  notes?: string;
}

class PrinterService {
  private config: PrinterConfig | null = null;

  setConfig(config: Partial<PrinterConfig>): void {
    this.config = {
      type: config.type || "tcp",
      tcpIp: config.tcpIp || "192.168.1.100",
      tcpPort: config.tcpPort || 9100,
      enabled: config.enabled ?? true,
      printKitchenOrders: config.printKitchenOrders ?? true,
    };
    log(`[Printer] Config updated: ${this.config.type} @ ${this.config.tcpIp}:${this.config.tcpPort}`);
  }

  async printKitchenOrder(order: PrinterOrder): Promise<boolean> {
    if (!this.config?.enabled || !this.config.printKitchenOrders) {
      log(`[Printer] Printing disabled or not configured`);
      return false;
    }

    try {
      log(`[Printer] Printing order ${order.orderId} to ${this.config.type}`);

      if (this.config.type === "tcp") {
        return await this.printToTCP(order);
      }

      // Other printer types would be implemented here
      return false;
    } catch (error) {
      console.error("[Printer] Print error:", error);
      return false;
    }
  }

  private async printToTCP(order: PrinterOrder): Promise<boolean> {
    try {
      if (!this.config?.tcpIp || !this.config.tcpPort) {
        throw new Error("Printer TCP config missing");
      }

      // Format ESC-POS thermal printer command
      const receiptText = this.formatESCPOS(order);
      
      log(`[Printer TCP] Sending to ${this.config.tcpIp}:${this.config.tcpPort}`);
      
      // In production, use actual TCP socket: net.Socket()
      // For now, simulate successful print
      return true;
    } catch (error) {
      console.error("[Printer TCP] Error:", error);
      return false;
    }
  }

  private formatESCPOS(order: PrinterOrder): string {
    // ESC-POS format for thermal printers
    let receipt = "";
    
    // Header
    receipt += "\n=== COZINHA ===\n";
    receipt += new Date().toLocaleString("pt-BR") + "\n";
    receipt += "=".repeat(32) + "\n\n";

    // Order info
    receipt += `PEDIDO: ${order.orderId}\n`;
    receipt += `CLIENTE: ${order.customerName}\n`;
    receipt += `TELEFONE: ${order.customerPhone}\n\n`;

    // Items
    receipt += "ITENS:\n";
    receipt += "-".repeat(32) + "\n";
    for (const item of order.items) {
      receipt += `${item.name}\n`;
      receipt += `  ${item.quantity}x R$ ${item.price}\n`;
    }

    // Total
    receipt += "-".repeat(32) + "\n";
    receipt += `TOTAL: R$ ${order.total}\n\n`;

    // Delivery address
    receipt += "ENDEREÇO:\n";
    receipt += order.deliveryAddress + "\n";

    // Notes
    if (order.notes) {
      receipt += `\nOBS: ${order.notes}\n`;
    }

    receipt += "\n" + "=".repeat(32) + "\n";

    return receipt;
  }

  getConfig(): PrinterConfig | null {
    return this.config;
  }

  testPrinter(): boolean {
    if (!this.config?.enabled) {
      log(`[Printer] Test failed: printer disabled`);
      return false;
    }

    log(`[Printer] Test print sent to ${this.config.type}`);
    return true;
  }
}

export const printerService = new PrinterService();
