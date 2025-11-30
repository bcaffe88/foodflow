const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { automaticPrint } = require('./printer_module');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permitir acesso do frontend do cardápio online
        methods: ["GET", "POST"]
    }
});

const PORT = 3001; // Porta para o backend de integração

// Middleware para parsing de JSON
app.use(express.json());

// --- Simulação de Banco de Dados (In-Memory para o protótipo) ---
let orders = [];

/**
 * Modelo de Pedido Unificado
 * @param {object} rawOrder - O objeto de pedido recebido do webhook.
 * @param {string} source - A origem do pedido (ex: "iFood", "Anota Aí").
 * @returns {object} O pedido normalizado.
 */
function normalizeOrder(rawOrder, source) {
    // Lógica de normalização: Mapear campos específicos de cada plataforma para o modelo unificado.
    // Para este protótipo, vamos criar um pedido genérico.
    const orderId = uuidv4();
    const now = new Date().toISOString();

    console.log(`Normalizando pedido ${orderId} da origem: ${source}`);

    // Exemplo de estrutura de dados unificada
    return {
        id: orderId,
        origem: source,
        id_origem: rawOrder.id_origem || `MOCK-${orderId.substring(0, 8)}`,
        status: 'Recebido',
        data_hora: now,
        cliente: {
            nome: rawOrder.cliente?.nome || "Cliente Teste",
            endereco: rawOrder.cliente?.endereco || "Rua Exemplo, 123",
            telefone: rawOrder.cliente?.telefone || "(99) 99999-9999"
        },
        itens: rawOrder.itens || [
            { nome: "Hamburguer X-Tudo", quantidade: 1, observacoes: "Sem picles" },
            { nome: "Batata Frita Grande", quantidade: 1, observacoes: "" }
        ],
        total: rawOrder.total || 45.50,
        forma_pagamento: rawOrder.forma_pagamento || "Cartão de Crédito",
        observacoes: rawOrder.observacoes || "Entrega urgente."
    };
}

/**
 * Processa um novo pedido: normaliza, armazena e notifica.
 * @param {object} rawOrder - O objeto de pedido recebido.
 * @param {string} source - A origem do pedido.
 */
function processNewOrder(rawOrder, source) {
    const newOrder = normalizeOrder(rawOrder, source);
    orders.unshift(newOrder); // Adiciona ao início da lista

    // 1. Notificação em Tempo Real para o Dashboard
    io.emit('new_order', newOrder);
    console.log(`Novo pedido ${newOrder.id} recebido e notificado.`);

    // 2. Impressão Automática
    // Em um sistema real, esta seria uma tarefa assíncrona (fila de mensagens)
    automaticPrint(newOrder);

    return newOrder;
}

// --- Rotas de Webhook (Simulação) ---

// Webhook iFood
app.post('/api/v1/webhooks/ifood', (req, res) => {
    // Em um sistema real, haveria validação de assinatura/token do iFood
    const rawOrder = req.body;
    const newOrder = processNewOrder(rawOrder, "iFood");
    res.status(200).json({ message: "Pedido iFood recebido com sucesso", order_id: newOrder.id });
});

// Webhook Anota Aí
app.post('/api/v1/webhooks/anotaai', (req, res) => {
    const rawOrder = req.body;
    const newOrder = processNewOrder(rawOrder, "Anota Aí");
    res.status(200).json({ message: "Pedido Anota Aí recebido com sucesso", order_id: newOrder.id });
});

// --- Rotas de API para o Dashboard ---

// Rota para listar todos os pedidos
app.get('/api/v1/pedidos', (req, res) => {
    res.json(orders);
});

// Rota para atualizar o status do pedido (usado pela Cozinha)
app.post('/api/v1/pedidos/:id/status', (req, res) => {
    const { id } = req.params;
    const { new_status } = req.body; // Espera-se 'Preparando', 'Pronto', 'Saiu para Entrega', 'Entregue', 'Cancelado'

    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ message: "Pedido não encontrado" });
    }

    const oldStatus = orders[orderIndex].status;
    orders[orderIndex].status = new_status;

    // Notificação em Tempo Real para o Dashboard (para atualizar a lista)
    io.emit('order_status_update', { id, old_status: oldStatus, new_status });
    console.log(`Status do pedido ${id} atualizado para: ${new_status}`);

    // Em um sistema real, aqui também haveria a lógica para:
    // 1. Atualizar o status na plataforma de origem (iFood, Anota Aí, etc.) via API.
    // 2. Logar a mudança de status.

    res.json({ message: "Status atualizado com sucesso", order: orders[orderIndex] });
});

// --- Configuração do Socket.IO ---

io.on('connection', (socket) => {
    console.log('Um cliente se conectou via WebSocket');

    socket.on('disconnect', () => {
        console.log('Um cliente se desconectou');
    });

    // Opcional: Enviar a lista atual de pedidos ao novo cliente conectado
    socket.emit('initial_orders', orders);
});

// --- Inicialização do Servidor ---

server.listen(PORT, () => {
    console.log(`Servidor de integração rodando na porta ${PORT}`);
});
