/**
 * Biblioteca de Recursos Nodo360
 * Sistema profesional de gestión de recursos con caché, precarga y optimización
 */

export enum ResourceType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  JSON = 'json',
  TEXT = 'text',
  BINARY = 'binary',
  FONT = 'font',
  MODEL_3D = 'model3d'
}

export enum ResourcePriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

export interface ResourceConfig {
  id: string;
  url: string;
  type: ResourceType;
  priority?: ResourcePriority;
  preload?: boolean;
  cache?: boolean;
  metadata?: Record<string, any>;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface CachedResource {
  data: any;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccess: number;
}

export class ResourceLibrary {
  private resources: Map<string, CachedResource> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private maxCacheSize: number;
  private currentCacheSize: number = 0;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(maxCacheSizeMB: number = 100) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convertir a bytes
  }

  /**
   * Carga un recurso de forma asíncrona
   */
  async load(config: ResourceConfig): Promise<any> {
    // Si ya está cargando, retornar la promesa existente
    if (this.loadingQueue.has(config.id)) {
      return this.loadingQueue.get(config.id);
    }

    // Si está en caché y cache está habilitado, retornar del caché
    if (config.cache !== false && this.resources.has(config.id)) {
      const cached = this.resources.get(config.id)!;
      cached.accessCount++;
      cached.lastAccess = Date.now();
      return cached.data;
    }

    // Crear promesa de carga
    const loadPromise = this.loadResource(config);
    this.loadingQueue.set(config.id, loadPromise);

    try {
      const data = await loadPromise;
      
      // Guardar en caché si está habilitado
      if (config.cache !== false) {
        this.cacheResource(config.id, data);
      }

      this.emit('load', { id: config.id, type: config.type });
      return data;
    } catch (error) {
      this.emit('error', { id: config.id, error });
      throw error;
    } finally {
      this.loadingQueue.delete(config.id);
    }
  }

  /**
   * Carga múltiples recursos en paralelo
   */
  async loadBatch(
    configs: ResourceConfig[],
    onProgress?: (progress: LoadProgress) => void
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    let loaded = 0;
    const total = configs.length;

    // Ordenar por prioridad
    const sortedConfigs = [...configs].sort(
      (a, b) => (a.priority || ResourcePriority.MEDIUM) - (b.priority || ResourcePriority.MEDIUM)
    );

    const promises = sortedConfigs.map(async (config) => {
      try {
        const data = await this.load(config);
        results.set(config.id, data);
        loaded++;
        
        if (onProgress) {
          onProgress({
            loaded,
            total,
            percentage: (loaded / total) * 100
          });
        }
      } catch (error) {
        console.error(`Error cargando recurso ${config.id}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Precarga recursos en segundo plano
   */
  async preload(configs: ResourceConfig[]): Promise<void> {
    const preloadConfigs = configs.filter(c => c.preload !== false);
    await this.loadBatch(preloadConfigs);
  }

  /**
   * Obtiene un recurso del caché
   */
  get(id: string): any | null {
    const cached = this.resources.get(id);
    if (cached) {
      cached.accessCount++;
      cached.lastAccess = Date.now();
      return cached.data;
    }
    return null;
  }

  /**
   * Verifica si un recurso está cargado
   */
  has(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * Libera un recurso específico del caché
   */
  unload(id: string): boolean {
    const cached = this.resources.get(id);
    if (cached) {
      this.currentCacheSize -= cached.size;
      this.resources.delete(id);
      this.emit('unload', { id });
      return true;
    }
    return false;
  }

  /**
   * Libera todos los recursos del caché
   */
  unloadAll(): void {
    const ids = Array.from(this.resources.keys());
    ids.forEach(id => this.unload(id));
  }

  /**
   * Limpia el caché según estrategia LRU (Least Recently Used)
   */
  private cleanCache(requiredSpace: number): void {
    if (this.currentCacheSize + requiredSpace <= this.maxCacheSize) {
      return;
    }

    // Ordenar por último acceso (más antiguo primero)
    const entries = Array.from(this.resources.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );

    for (const [id, cached] of entries) {
      if (this.currentCacheSize + requiredSpace <= this.maxCacheSize) {
        break;
      }
      this.unload(id);
    }
  }

  /**
   * Cachea un recurso
   */
  private cacheResource(id: string, data: any): void {
    const size = this.estimateSize(data);
    this.cleanCache(size);

    this.resources.set(id, {
      data,
      timestamp: Date.now(),
      size,
      accessCount: 1,
      lastAccess: Date.now()
    });

    this.currentCacheSize += size;
  }

  /**
   * Carga el recurso según su tipo
   */
  private async loadResource(config: ResourceConfig): Promise<any> {
    switch (config.type) {
      case ResourceType.IMAGE:
        return this.loadImage(config.url);
      case ResourceType.AUDIO:
        return this.loadAudio(config.url);
      case ResourceType.VIDEO:
        return this.loadVideo(config.url);
      case ResourceType.JSON:
        return this.loadJSON(config.url);
      case ResourceType.TEXT:
        return this.loadText(config.url);
      case ResourceType.BINARY:
        return this.loadBinary(config.url);
      case ResourceType.FONT:
        return this.loadFont(config.url);
      case ResourceType.MODEL_3D:
        return this.loadModel3D(config.url);
      default:
        throw new Error(`Tipo de recurso no soportado: ${config.type}`);
    }
  }

  /**
   * Carga una imagen
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Error cargando imagen: ${url}`));
      img.src = url;
    });
  }

  /**
   * Carga audio
   */
  private async loadAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Carga video
   */
  private loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadeddata = () => resolve(video);
      video.onerror = () => reject(new Error(`Error cargando video: ${url}`));
      video.src = url;
      video.load();
    });
  }

  /**
   * Carga JSON
   */
  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Carga texto
   */
  private async loadText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  }

  /**
   * Carga binario
   */
  private async loadBinary(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  /**
   * Carga fuente
   */
  private async loadFont(url: string): Promise<FontFace> {
    const fontName = url.split('/').pop()?.split('.')[0] || 'CustomFont';
    const fontFace = new FontFace(fontName, `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    return fontFace;
  }

  /**
   * Carga modelo 3D (placeholder - requiere librería específica)
   */
  private async loadModel3D(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // O usar GLTFLoader, etc.
  }

  /**
   * Estima el tamaño de un recurso en bytes
   */
  private estimateSize(data: any): number {
    if (data instanceof HTMLImageElement) {
      return (data.width * data.height * 4) || 1024;
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (typeof data === 'string') {
      return data.length * 2;
    }
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 1024; // Tamaño por defecto
  }

  /**
   * Sistema de eventos
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    return {
      totalResources: this.resources.size,
      cacheSize: this.currentCacheSize,
      maxCacheSize: this.maxCacheSize,
      cacheUsagePercentage: (this.currentCacheSize / this.maxCacheSize) * 100,
      resources: Array.from(this.resources.entries()).map(([id, cached]) => ({
        id,
        size: cached.size,
        accessCount: cached.accessCount,
        lastAccess: new Date(cached.lastAccess)
      }))
    };
  }
}


