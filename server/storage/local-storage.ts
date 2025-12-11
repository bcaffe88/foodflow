/**
 * Storage Service - Local Implementation (substitui Firebase)
 * Sem custos, sem dependências externas
 * 
 * Estratégias:
 * 1. In-memory storage (desenvolvimento) - padrão
 * 2. Database storage (produção) - usando banco existente
 * 3. File storage (fallback)
 */

export interface StorageData {
  key: string;
  value: any;
  timestamp: Date;
  ttl?: number; // Time to live em segundos
}

class StorageService {
  private storage: Map<string, StorageData> = new Map();
  private useDatabase: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o serviço de storage
   */
  private initialize() {
    console.log('[StorageService] ✅ Serviço de Storage inicializado (local)');
    console.log('[StorageService] Modo: In-Memory + TTL Support');

    // Inicia limpeza periódica de dados expirados
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // A cada minuto
  }

  /**
   * Armazena um valor
   */
  async set(
    key: string,
    value: any,
    options?: { ttl?: number; namespace?: string }
  ): Promise<boolean> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;

    this.storage.set(fullKey, {
      key: fullKey,
      value,
      timestamp: new Date(),
      ttl: options?.ttl,
    });

    console.log(`[StorageService] ✅ Armazenado: ${fullKey}`);
    return true;
  }

  /**
   * Recupera um valor
   */
  async get<T>(
    key: string,
    options?: { namespace?: string }
  ): Promise<T | null> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;
    const data = this.storage.get(fullKey);

    if (!data) {
      return null;
    }

    // Verifica se expirou
    if (data.ttl) {
      const age = (Date.now() - data.timestamp.getTime()) / 1000;
      if (age > data.ttl) {
        this.storage.delete(fullKey);
        return null;
      }
    }

    return data.value as T;
  }

  /**
   * Atualiza um valor (merge)
   */
  async update(
    key: string,
    updates: Record<string, any>,
    options?: { namespace?: string }
  ): Promise<boolean> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;
    const data = this.storage.get(fullKey);

    if (!data) {
      return false;
    }

    const mergedValue = {
      ...data.value,
      ...updates,
      _updatedAt: new Date(),
    };

    this.storage.set(fullKey, {
      ...data,
      value: mergedValue,
      timestamp: new Date(),
    });

    console.log(`[StorageService] ✅ Atualizado: ${fullKey}`);
    return true;
  }

  /**
   * Remove um valor
   */
  async delete(key: string, options?: { namespace?: string }): Promise<boolean> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;
    const deleted = this.storage.delete(fullKey);

    if (deleted) {
      console.log(`[StorageService] ✅ Removido: ${fullKey}`);
    }

    return deleted;
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string, options?: { namespace?: string }): Promise<boolean> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;
    const data = this.storage.get(fullKey);

    if (!data) {
      return false;
    }

    // Verifica se expirou
    if (data.ttl) {
      const age = (Date.now() - data.timestamp.getTime()) / 1000;
      if (age > data.ttl) {
        this.storage.delete(fullKey);
        return false;
      }
    }

    return true;
  }

  /**
   * Recupera todas as chaves de um namespace
   */
  async keys(namespace?: string): Promise<string[]> {
    const prefix = namespace ? `${namespace}:` : '';
    return Array.from(this.storage.keys())
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.substring(prefix.length));
  }

  /**
   * Recupera todos os valores de um namespace
   */
  async getAll<T>(namespace?: string): Promise<Record<string, T>> {
    const prefix = namespace ? `${namespace}:` : '';
    const result: Record<string, T> = {};

    const entries = Array.from(this.storage.entries());
    for (const [key, data] of entries) {
      if (!key.startsWith(prefix)) continue;

      // Verifica expiração
      if (data.ttl) {
        const age = (Date.now() - data.timestamp.getTime()) / 1000;
        if (age > data.ttl) {
          this.storage.delete(key);
          continue;
        }
      }

      const shortKey = key.substring(prefix.length);
      result[shortKey] = data.value as T;
    }

    return result;
  }

  /**
   * Incrementa um contador
   */
  async increment(
    key: string,
    amount: number = 1,
    options?: { namespace?: string }
  ): Promise<number> {
    const fullKey = options?.namespace ? `${options.namespace}:${key}` : key;
    const data = this.storage.get(fullKey);

    let newValue = amount;
    if (data && typeof data.value === 'number') {
      newValue = data.value + amount;
    }

    this.storage.set(fullKey, {
      key: fullKey,
      value: newValue,
      timestamp: new Date(),
    });

    return newValue;
  }

  /**
   * Decrementa um contador
   */
  async decrement(
    key: string,
    amount: number = 1,
    options?: { namespace?: string }
  ): Promise<number> {
    return this.increment(key, -amount, options);
  }

  /**
   * Lista de espera (FIFO queue)
   */
  async pushToQueue(
    queueName: string,
    item: any,
    options?: { namespace?: string }
  ): Promise<number> {
    const fullKey = options?.namespace ? `${options.namespace}:queue:${queueName}` : `queue:${queueName}`;
    const data = this.storage.get(fullKey);

    const queue: Array<{ item: any; timestamp: Date }> = data ? (Array.isArray(data) ? data : []) : [];
    queue.push({
      item,
      timestamp: new Date(),
    });

    this.storage.set(fullKey, {
      key: fullKey,
      value: queue,
      timestamp: new Date(),
    });

    return queue.length;
  }

  /**
   * Remove do início da fila
   */
  async popFromQueue(
    queueName: string,
    options?: { namespace?: string }
  ): Promise<any | null> {
    const fullKey = options?.namespace ? `${options.namespace}:queue:${queueName}` : `queue:${queueName}`;
    const data = this.storage.get(fullKey);

    if (!data || !Array.isArray(data)) {
      return null;
    }

    const item = data.shift();

    if (data.length === 0) {
      this.storage.delete(fullKey);
    } else {
      this.storage.set(fullKey, {
        key: fullKey,
        value: data,
        timestamp: new Date(),
      });
    }

    return item;
  }

  /**
   * Obtém o tamanho de uma fila
   */
  async getQueueSize(queueName: string, options?: { namespace?: string }): Promise<number> {
    const fullKey = options?.namespace ? `${options.namespace}:queue:${queueName}` : `queue:${queueName}`;
    const data = this.storage.get(fullKey);

    return Array.isArray(data) ? data.length : 0;
  }

  /**
   * Limpeza automática de dados expirados
   */
  private cleanupExpired() {
    let cleaned = 0;

    const entries = Array.from(this.storage.entries());
    for (const [key, data] of entries) {
      if (data.ttl) {
        const age = (Date.now() - data.timestamp.getTime()) / 1000;
        if (age > data.ttl) {
          this.storage.delete(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[StorageService] 🧹 Limpeza: ${cleaned} dados expirados removidos`);
    }
  }

  /**
   * Limpa todo o storage (cuidado!)
   */
  async clear(): Promise<void> {
    this.storage.clear();
    console.log('[StorageService] ✅ Storage limpo completamente');
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    const stats = {
      totalKeys: this.storage.size,
      keys: Array.from(this.storage.keys()),
      memory: {
        estimated: JSON.stringify(Array.from(this.storage.entries())).length, // Bytes
      },
    };

    return stats;
  }

  /**
   * Exporta dados (backup)
   */
  async export(): Promise<any> {
    const data: Record<string, any> = {};

    const entries = Array.from(this.storage.entries());
    for (const [key, value] of entries) {
      data[key] = value.value;
    }

    return data;
  }

  /**
   * Importa dados (restore)
   */
  async import(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      this.storage.set(key, {
        key,
        value,
        timestamp: new Date(),
      });
    }

    console.log(`[StorageService] ✅ Importado: ${Object.keys(data).length} chaves`);
  }

  /**
   * Testa a conexão/funcionalidade
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.set('_health_check', { timestamp: new Date() });
      const value = await this.get('_health_check');
      await this.delete('_health_check');

      console.log('[StorageService] ✅ Storage service está operacional');
      return value !== null;
    } catch (error) {
      console.error('[StorageService] ❌ Erro ao testar storage:', error);
      return false;
    }
  }

  /**
   * Destrutor - limpa interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const storageService = new StorageService();
export default storageService;
