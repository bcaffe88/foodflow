import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "" });

interface ProductGenerationRequest {
  restaurantName: string;
  cuisineType: string;
  context?: string;
}

interface GeneratedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  preparationTime?: number;
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

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  try {
    const content = (response.candidates?.[0]?.content?.parts?.[0] as any)?.text || "";
    if (!content) throw new Error("Resposta vazia do LLM");

    // Extract JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

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

export async function improveProductDescription(
  productName: string,
  currentDescription?: string
): Promise<string> {
  const prompt = `Melhore a descrição deste produto de restaurante para ser mais atrativa ao cliente. Responda APENAS com a descrição melhorada (1-2 linhas, max 150 caracteres):

Produto: ${productName}
${currentDescription ? `Descrição atual: ${currentDescription}` : ""}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const content = (response.candidates?.[0]?.content?.parts?.[0] as any)?.text || "";
  return (content || currentDescription || "").trim();
}
