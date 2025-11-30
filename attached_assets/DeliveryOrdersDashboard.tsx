import React, { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, CheckCircle, XCircle } from "lucide-react";

// Definição do Modelo de Dados Unificado (Baseado no backend/server.js)
interface Customer {
  nome: string;
  endereco: string;
  telefone: string;
}

interface Item {
  nome: string;
  quantidade: number;
  observacoes: string;
}

interface DeliveryOrder {
  id: string;
  origem: string;
  id_origem: string;
  status: "Recebido" | "Preparando" | "Pronto" | "Saiu para Entrega" | "Entregue" | "Cancelado";
  data_hora: string;
  cliente: Customer;
  itens: Item[];
  total: number;
  forma_pagamento: string;
  observacoes: string;
}

// URL do Backend de Integração (Substitua pela URL de produção)
// Usando a URL temporária para fins de demonstração/teste
const BACKEND_URL = "https://3001-ix5e494ti7contfx0nujh-0dfbcecc.manusvm.computer";

let socket: Socket;

const DeliveryOrdersDashboard: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusConfig = (status: DeliveryOrder["status"]) => {
    const config: Record<DeliveryOrder["status"], { label: string; color: string }> = {
      Recebido: { label: "Novo Pedido", color: "bg-red-500" },
      Preparando: { label: "Em Preparo", color: "bg-yellow-500" },
      Pronto: { label: "Pronto para Envio", color: "bg-green-500" },
      "Saiu para Entrega": { label: "Saiu para Entrega", color: "bg-blue-500" },
      Entregue: { label: "Entregue", color: "bg-gray-500" },
      Cancelado: { label: "Cancelado", color: "bg-gray-500" },
    };
    return config[status] || config.Recebido;
  };

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: DeliveryOrder["status"]) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/pedidos/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status");
      }
      // A atualização do estado virá via Socket.IO
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar o status do pedido. Verifique o console.");
    }
  }, []);

  const printOrder = useCallback((orderId: string) => {
    // Em um sistema real, faria uma requisição POST para o backend
    // Ex: fetch(`${BACKEND_URL}/api/v1/pedidos/${orderId}/imprimir`, { method: 'POST' });
    alert(`Comando de reimpressão para o pedido ${orderId} enviado!`);
  }, []);

  useEffect(() => {
    // Inicializa a conexão Socket.IO
    socket = io(BACKEND_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Conectado ao servidor de integração.");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Desconectado do servidor de integração.");
    });

    // Recebe a lista inicial de pedidos
    socket.on("initial_orders", (initialOrders: DeliveryOrder[]) => {
      setOrders(initialOrders.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()));
    });

    // Recebe um novo pedido
    socket.on("new_order", (newOrder: DeliveryOrder) => {
      setOrders((prevOrders) => {
        // Alerta sonoro para novo pedido
        new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3').play().catch(e => console.log("Erro ao tocar som:", e));
        return [newOrder, ...prevOrders].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
      });
    });

    // Recebe atualização de status
    socket.on("order_status_update", ({ id, new_status }: { id: string; new_status: DeliveryOrder["status"] }) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === id ? { ...order, status: new_status } : order))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
        <p>Conectando ao servidor de pedidos de delivery...</p>
        <p className="text-sm mt-2">Verifique se o backend de integração está ativo em {BACKEND_URL}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Nenhum pedido de delivery externo ainda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);
        return (
          <Card
            key={order.id}
            className={`border-l-4 ${statusConfig.color} shadow-lg transition-shadow duration-300 hover:shadow-xl`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Pedido #{order.id_origem}
              </CardTitle>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Origem: <span className="font-semibold text-primary">{order.origem}</span>
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Cliente:</span> {order.cliente.nome}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Endereço:</span> {order.cliente.endereco}
              </p>
              <p className="text-sm mb-1">
                <span className="font-medium">Pagamento:</span> {order.forma_pagamento}
              </p>
              <p className="text-lg font-bold mt-2">
                Total: {formatPrice(order.total)}
              </p>

              <div className="mt-4 pt-3 border-t border-dashed">
                <h4 className="font-semibold mb-2">Itens:</h4>
                <ul className="list-disc list-inside text-sm">
                  {order.itens.map((item, index) => (
                    <li key={index}>
                      {item.quantidade}x {item.nome}
                      {item.observacoes && (
                        <span className="text-red-500 ml-2">({item.observacoes})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {order.status === "Recebido" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "Preparando")}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <Clock className="h-4 w-4 mr-2" /> Preparar
                  </Button>
                )}
                {order.status === "Preparando" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "Pronto")}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Pronto
                  </Button>
                )}
                {order.status === "Pronto" && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, "Saiu para Entrega")}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Truck className="h-4 w-4 mr-2" /> Saiu para Entrega
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => printOrder(order.id)}>
                  Reimprimir
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DeliveryOrdersDashboard;
