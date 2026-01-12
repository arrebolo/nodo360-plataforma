/**
 * Utilidades para Biblioteca de Recursos Nodo360
 */

export class ResourceUtils {
  /**
   * Detecta el tipo de recurso por extensión de archivo
   */
  static detectResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      // Imágenes
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'webp': 'image',
      'svg': 'image',
      'bmp': 'image',
      
      // Audio
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'aac': 'audio',
      'm4a': 'audio',
      
      // Video
      'mp4': 'video',
      'webm': 'video',
      'ogv': 'video',
      'mov': 'video',
      
      // Fuentes
      'ttf': 'font',
      'otf': 'font',
      'woff': 'font',
      'woff2': 'font',
      
      // Datos
      'json': 'json',
      'txt': 'text',
      'xml': 'text',
      'csv': 'text',
      
      // 3D
      'gltf': 'model3d',
      'glb': 'model3d',
      'obj': 'model3d',
      'fbx': 'model3d'
    };

    return typeMap[extension || ''] || 'binary';
  }

  /**
   * Genera un hash simple para un string
   */
  static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Convierte bytes a formato legible
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Valida una URL
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crea un blob URL desde datos
   */
  static createBlobURL(data: Blob | MediaSource): string {
    return URL.createObjectURL(data);
  }

  /**
   * Revoca un blob URL
   */
  static revokeBlobURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Descarga un recurso como archivo
   */
  static downloadResource(data: Blob | string, filename: string): void {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: 'text/plain' })
      : data;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Comprime una imagen
   */
  static async compressImage(
    image: HTMLImageElement,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    let width = image.width;
    let height = image.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = width * ratio;
      height = height * ratio;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Error comprimiendo imagen'));
        },
        'image/jpeg',
        quality
      );
    });
  }

  /**
   * Genera una miniatura de una imagen
   */
  static async createThumbnail(
    image: HTMLImageElement,
    size: number = 128
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = size;
    canvas.height = size;

    const scale = Math.max(size / image.width, size / image.height);
    const x = (size - image.width * scale) / 2;
    const y = (size - image.height * scale) / 2;

    ctx.drawImage(image, x, y, image.width * scale, image.height * scale);

    return canvas.toDataURL('image/jpeg', 0.7);
  }
}

/**
 * Pool de recursos reutilizables
 */
export class ResourcePool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset?: (item: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    initialSize: number = 10,
    maxSize: number = 50,
    reset?: (item: T) => void
  ) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.reset = reset;

    // Crear objetos iniciales
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * Obtiene un recurso del pool
   */
  acquire(): T {
    let item: T;

    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else if (this.inUse.size < this.maxSize) {
      item = this.factory();
    } else {
      throw new Error('Pool agotado: máximo de recursos alcanzado');
    }

    this.inUse.add(item);
    return item;
  }

  /**
   * Devuelve un recurso al pool
   */
  release(item: T): void {
    if (!this.inUse.has(item)) {
      console.warn('Intentando liberar un item que no está en uso');
      return;
    }

    this.inUse.delete(item);

    if (this.reset) {
      this.reset(item);
    }

    this.available.push(item);
  }

  /**
   * Libera todos los recursos
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Obtiene estadísticas del pool
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxSize: this.maxSize
    };
  }
}

/**
 * Cola de prioridad para carga de recursos
 */
export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number = 0): void {
    const queueItem = { item, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (priority < this.items[i].priority) {
        this.items.splice(i, 0, queueItem);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueItem);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }
}

/**
 * Limitador de tasa para peticiones
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running: number = 0;
  private maxConcurrent: number;
  private minDelay: number;
  private lastExecution: number = 0;

  constructor(maxConcurrent: number = 5, minDelay: number = 100) {
    this.maxConcurrent = maxConcurrent;
    this.minDelay = minDelay;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Esperar el delay mínimo
          const now = Date.now();
          const timeSinceLastExecution = now - this.lastExecution;
          if (timeSinceLastExecution < this.minDelay) {
            await new Promise(r => setTimeout(r, this.minDelay - timeSinceLastExecution));
          }

          this.running++;
          this.lastExecution = Date.now();
          
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const fn = this.queue.shift();
    if (fn) {
      fn();
    }
  }

  getStats() {
    return {
      queued: this.queue.length,
      running: this.running,
      maxConcurrent: this.maxConcurrent
    };
  }
}


