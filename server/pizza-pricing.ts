import { Decimal } from 'decimal.js'

export interface FlavorSelection {
  id: string
  name: string
  price: number
}

export interface PizzaSizeConfig {
  pequena: { maxFlavors: number; priceMultiplier: number }
  media: { maxFlavors: number; priceMultiplier: number }
  grande: { maxFlavors: number; priceMultiplier: number }
  super: { maxFlavors: number; priceMultiplier: number }
}

const SIZE_CONFIG: PizzaSizeConfig = {
  pequena: { maxFlavors: 2, priceMultiplier: 0.75 },
  media: { maxFlavors: 4, priceMultiplier: 1.0 },
  grande: { maxFlavors: 4, priceMultiplier: 1.2 },
  super: { maxFlavors: 4, priceMultiplier: 1.35 },
}

/**
 * Calcula preço de pizza com múltiplos sabores
 * Lógica: Soma preços dos sabores dividido pela quantidade
 * Ex: 2 sabores a R$50 cada = (50+50)/2 = R$50
 * Ex: 3 sabores a R$50, R$40, R$60 = (50+40+60)/3 = R$50
 */
export function calculatePizzaPrice(
  flavors: FlavorSelection[],
  size: keyof typeof SIZE_CONFIG = 'media'
): number {
  const config = SIZE_CONFIG[size]

  if (!config) {
    throw new Error(`Tamanho de pizza inválido: ${size}`)
  }

  if (flavors.length === 0) {
    throw new Error('Deve ter pelo menos 1 sabor')
  }

  if (flavors.length > config.maxFlavors) {
    throw new Error(
      `Tamanho ${size} permite no máximo ${config.maxFlavors} sabores`
    )
  }

  // Soma preços dos sabores
  const totalPrice = flavors.reduce((sum, flavor) => sum + flavor.price, 0)

  // Divide pela quantidade de sabores (média)
  const averagePrice = totalPrice / flavors.length

  // Aplica multiplicador do tamanho
  const finalPrice = averagePrice * config.priceMultiplier

  return Math.round(finalPrice * 100) / 100 // Round to 2 decimals
}

/**
 * Valida seleção de sabores
 */
export function validateFlavorSelection(
  selectedFlavorIds: string[],
  availableFlavorIds: string[],
  size: keyof typeof SIZE_CONFIG
): { valid: boolean; error?: string } {
  const config = SIZE_CONFIG[size]

  if (selectedFlavorIds.length === 0) {
    return { valid: false, error: 'Selecione pelo menos 1 sabor' }
  }

  if (selectedFlavorIds.length > config.maxFlavors) {
    return {
      valid: false,
      error: `Máximo ${config.maxFlavors} sabores para tamanho ${size}`,
    }
  }

  // Verifica se todos os sabores selecionados existem
  const invalidFlavors = selectedFlavorIds.filter(
    (id) => !availableFlavorIds.includes(id)
  )
  if (invalidFlavors.length > 0) {
    return { valid: false, error: 'Um ou mais sabores inválidos' }
  }

  return { valid: true }
}

export const getSizeConfig = () => SIZE_CONFIG
export const getMaxFlavorsForSize = (size: string) =>
  SIZE_CONFIG[size as keyof typeof SIZE_CONFIG]?.maxFlavors || 1
