/**
 * Gestor de Manifiestos para Nodo360
 * Permite definir recursos de forma declarativa
 */

import { ResourceLibrary, ResourceConfig, ResourceType, ResourcePriority } from './ResourceLibrary';

export interface ResourceManifest {
  name: string;
  version: string;
  baseURL?: string;
  resources: ResourceConfig[];
}

export class ManifestManager {
  private library: ResourceLibrary;
  private manifests: Map<string, ResourceManifest> = new Map();
  private baseURLOverride?: string;

  constructor(library: ResourceLibrary, baseURL?: string) {
    this.library = library;
    this.baseURLOverride = baseURL;
  }

  /**
   * Carga un manifiesto desde una URL o objeto
   */
  async loadManifest(source: string | ResourceManifest, name?: string): Promise<void> {
    let manifest: ResourceManifest;

    if (typeof source === 'string') {
      // Cargar desde URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Error cargando manifiesto: ${response.status}`);
      }
      manifest = await response.json();
    } else {
      manifest = source;
    }

    const manifestName = name || manifest.name;
    this.manifests.set(manifestName, manifest);
  }

  /**
   * Carga todos los recursos de un manifiesto
   */
  async loadManifestResources(
    manifestName: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const manifest = this.manifests.get(manifestName);
    if (!manifest) {
      throw new Error(`Manifiesto no encontrado: ${manifestName}`);
    }

    const baseURL = this.baseURLOverride || manifest.baseURL || '';
    
    // Preparar configuraciones con URL completa
    const configs = manifest.resources.map(resource => ({
      ...resource,
      url: this.resolveURL(baseURL, resource.url)
    }));

    let loaded = 0;
    await this.library.loadBatch(configs, (progress) => {
      loaded = progress.loaded;
      if (onProgress) {
        onProgress(progress.loaded, progress.total);
      }
    });
  }

  /**
   * Carga recursos específicos de un manifiesto por IDs
   */
  async loadManifestResourcesByIds(
    manifestName: string,
    resourceIds: string[]
  ): Promise<void> {
    const manifest = this.manifests.get(manifestName);
    if (!manifest) {
      throw new Error(`Manifiesto no encontrado: ${manifestName}`);
    }

    const baseURL = this.baseURLOverride || manifest.baseURL || '';
    const resources = manifest.resources.filter(r => resourceIds.includes(r.id));

    const configs = resources.map(resource => ({
      ...resource,
      url: this.resolveURL(baseURL, resource.url)
    }));

    await this.library.loadBatch(configs);
  }

  /**
   * Carga recursos por tipo
   */
  async loadManifestResourcesByType(
    manifestName: string,
    type: ResourceType
  ): Promise<void> {
    const manifest = this.manifests.get(manifestName);
    if (!manifest) {
      throw new Error(`Manifiesto no encontrado: ${manifestName}`);
    }

    const baseURL = this.baseURLOverride || manifest.baseURL || '';
    const resources = manifest.resources.filter(r => r.type === type);

    const configs = resources.map(resource => ({
      ...resource,
      url: this.resolveURL(baseURL, resource.url)
    }));

    await this.library.loadBatch(configs);
  }

  /**
   * Obtiene la lista de recursos de un manifiesto
   */
  getManifestResources(manifestName: string): ResourceConfig[] {
    const manifest = this.manifests.get(manifestName);
    return manifest ? [...manifest.resources] : [];
  }

  /**
   * Resuelve URL completa
   */
  private resolveURL(baseURL: string, resourceURL: string): string {
    if (resourceURL.startsWith('http://') || resourceURL.startsWith('https://')) {
      return resourceURL;
    }
    return baseURL.endsWith('/') 
      ? `${baseURL}${resourceURL}` 
      : `${baseURL}/${resourceURL}`;
  }

  /**
   * Lista todos los manifiestos cargados
   */
  listManifests(): string[] {
    return Array.from(this.manifests.keys());
  }

  /**
   * Elimina un manifiesto
   */
  removeManifest(name: string): boolean {
    return this.manifests.delete(name);
  }
}

/**
 * Constructor de manifiestos para creación fluida
 */
export class ManifestBuilder {
  private manifest: ResourceManifest;

  constructor(name: string, version: string = '1.0.0') {
    this.manifest = {
      name,
      version,
      resources: []
    };
  }

  setBaseURL(url: string): this {
    this.manifest.baseURL = url;
    return this;
  }

  addResource(config: ResourceConfig): this {
    this.manifest.resources.push(config);
    return this;
  }

  addImage(id: string, url: string, preload: boolean = false): this {
    return this.addResource({
      id,
      url,
      type: ResourceType.IMAGE,
      preload,
      cache: true
    });
  }

  addAudio(id: string, url: string, preload: boolean = false): this {
    return this.addResource({
      id,
      url,
      type: ResourceType.AUDIO,
      preload,
      cache: true
    });
  }

  addJSON(id: string, url: string, preload: boolean = false): this {
    return this.addResource({
      id,
      url,
      type: ResourceType.JSON,
      preload,
      cache: true
    });
  }

  addFont(id: string, url: string, preload: boolean = true): this {
    return this.addResource({
      id,
      url,
      type: ResourceType.FONT,
      preload,
      cache: true,
      priority: ResourcePriority.HIGH
    });
  }

  build(): ResourceManifest {
    return { ...this.manifest };
  }

  toJSON(): string {
    return JSON.stringify(this.manifest, null, 2);
  }
}
