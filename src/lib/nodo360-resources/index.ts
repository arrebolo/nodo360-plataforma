/**
 * Nodo360 Resource Library
 * Biblioteca profesional de gestión de recursos
 * @version 1.0.0
 */

// Exportar biblioteca principal
export {
  ResourceLibrary,
  ResourceType,
  ResourcePriority,
  ResourceConfig,
  LoadProgress
} from './ResourceLibrary';

// Exportar gestor de manifiestos
export {
  ManifestManager,
  ManifestBuilder,
  ResourceManifest
} from './ManifestManager';

// Exportar utilidades
export {
  ResourceUtils,
  ResourcePool,
  PriorityQueue,
  RateLimiter
} from './ResourceUtils';



/**
 * Función de conveniencia para crear una instancia configurada
 */
export function createResourceLibrary(config?: {
  maxCacheSizeMB?: number;
  baseURL?: string;
}) {
  const library = new ResourceLibrary(config?.maxCacheSizeMB);
  const manifestManager = new ManifestManager(library, config?.baseURL);

  return {
    library,
    manifestManager
  };
}

// Reexportar imports necesarios
import { ResourceLibrary } from './ResourceLibrary';
import { ManifestManager } from './ManifestManager';

// Versión de la biblioteca
export const VERSION = '1.0.0';


