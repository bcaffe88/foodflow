import OpenAI from "openai";

// o modelo mais novo OpenAI é "gpt-5", lançado em 7 agosto de 2025, não mude isso a menos que explicitamente solicitado
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProductGenerationRequest {
  restaurantName: string;
  cuisineType: string;
  context?: string; // Ex: "Pizzaria italiana tradicional", "Sushi premium", etc
}

interface GeneratedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  preparationTime?: number; // em minutos
  isAvailable: boolean;
}

interface GenerationResponse {
  products: GeneratedProduct[];
  summary: string;
}

export async function generateProductsWithLLM(
  req: ProductGenerationRequest
): Promise<GenerationResponse> {
  const prompt = `Você é um especialista em cardápios de restaurantes. Gere produtos para o seguinte restaurante:

Nome: ${req.restaurantName}
Tipo de Culinária: ${req.cuisineType}
${req.context ? `Contexto: ${req.context}` : ""}

Gere uma lista de 8-12 produtos típicos para este restaurante. Para CADA produto, forneça:
- Nome do produto (em português)
- Descrição breve (1-2 linhas)
- Preço sugerido em BRL
- Categoria (ex: Entrada, Prato Principal, Bebida, Sobremesa)
- Tempo de preparo em minutos

IMPORTANTE: Responda APENAS em JSON válido (sem markdown), sem explicações antes ou depois. Seguindo este formato exato:
{
  "products": [
    {
      "name": "Nome do Produto",
      "description": "Descrição breve do produto",
      "price": 29.90,
      "category": "Prato Principal",
      "preparationTime": 15,
      "isAvailable": true
    }
  ],
  "summary": "Resumo breve dos produtos gerados"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "Você é um assistente especializado em criação de cardápios de restaurantes. Sempre responda com JSON válido e bem formatado.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048,
  });

  try {
    const content = response.choices[0].message.content;
    if (!content) throw new Error("Resposta vazia do LLM");

    const parsed = JSON.parse(content);

    // Validar e sanitizar produtos
    const products = (parsed.products || []).map((p: any) => ({
      name: String(p.name || "").substring(0, 100),
      description: String(p.description || "").substring(0, 500),
      price: Math.max(1, Math.min(1000, Number(p.price) || 10)),
      category: String(p.category || "Diversos").substring(0, 50),
      preparationTime: Math.max(5, Math.min(120, Number(p.preparationTime) || 15)),
      isAvailable: p.isAvailable !== false,
    }));

    return {
      products,
      summary: String(parsed.summary || "Produtos gerados com sucesso"),
    };
  } catch (error) {
    console.error("Erro ao parsear resposta LLM:", error);
    throw new Error("Falha ao gerar produtos: formato inválido");
  }
}

export async function analyzeProductCategory(productName: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente que categoriza produtos de restaurante. Responda APENAS com a categoria em uma palavra (Entrada, Prato Principal, Bebida, Sobremesa, Acompanhamento, Sauce).",
      },
      {
        role: "user",
        content: `Categorize este produto: "${productName}"`,
      },
    ],
    max_completion_tokens: 10,
  });

  return (response.choices[0].message.content || "Diversos").trim();
}

export async function improveProductDescription(
  productName: string,
  currentDescription?: string
): Promise<string> {
  const prompt = `Melhore a descrição deste produto de restaurante para ser mais atrativa ao cliente. Responda APENAS com a descrição melhorada (1-2 linhas, max 150 caracteres):

Produto: ${productName}
${currentDescription ? `Descrição atual: ${currentDescription}` : ""}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content:
          "Você é um copywriter especializado em cardápios de restaurante. Crie descrições atrativas, concisas e que destaquem os benefícios do prato.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_completion_tokens: 100,
  });

  return (response.choices[0].message.content || currentDescription || "").trim();
}
