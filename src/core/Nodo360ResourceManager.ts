/**
 * Nodo360ResourceManager.ts
 * Gestor de recursos listo para copiar y usar en nodo360.com
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo a: src/core/Nodo360ResourceManager.ts
 * 2. Ajusta las rutas de import según tu estructura
 * 3. ¡Listo para usar!
 */

import { 
  ResourceLibrary, 
  ManifestManager,
  ResourceType,
  ResourcePriority 
} from '../lib/nodo360-resources';

export interface CourseProgress {
  courseSlug: string;
  currentLesson: number;
  totalLessons: number;
  completedLessons: number[];
}

export class Nodo360ResourceManager {
  private static instance: Nodo360ResourceManager | null = null;
  private library: ResourceLibrary;
  private manifestManager: ManifestManager;
  private currentCourse: string | null = null;
  private preloadedLessons: Set<string> = new Set();
  private courseProgress: Map<string, CourseProgress> = new Map();

  private constructor(config?: {
    cacheSize?: number;
    baseURL?: string;
  }) {
    // 300MB de caché para contenido educativo (ajustable)
    this.library = new ResourceLibrary(config?.cacheSize || 300);
    this.manifestManager = new ManifestManager(
      this.library,
      config?.baseURL || '/assets'
    );

    this.setupEventListeners();
    console.log('[Nodo360] ResourceManager inicializado ✓');
  }

  /**
   * Obtener instancia única (Singleton)
   */
  static getInstance(config?: { cacheSize?: number; baseURL?: string }): Nodo360ResourceManager {
    if (!Nodo360ResourceManager.instance) {
      Nodo360ResourceManager.instance = new Nodo360ResourceManager(config);
    }
    return Nodo360ResourceManager.instance;
  }

  /**
   * Configurar eventos para tracking
   */
  private setupEventListeners(): void {
    this.library.on('load', (data) => {
      console.log(`[Nodo360] ✓ ${data.id} cargado`);
      this.trackResourceLoad(data.id, data.type);
    });

    this.library.on('error', (data) => {
      console.error(`[Nodo360] ✗ Error en ${data.id}:`, data.error);
      this.trackResourceError(data.id, data.error);
    });

    this.library.on('unload', (data) => {
      console.log(`[Nodo360] 🗑️ ${data.id} liberado`);
    });
  }

  /**
   * Cargar curso completo
   */
  async loadCourse(
    courseSlug: string, 
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    console.log(`[Nodo360] 📚 Cargando curso: ${courseSlug}`);

    try {
      // Actualizar progreso
      onProgress?.(0, 'Preparando curso...');

      // Cargar manifiesto del curso
      const manifestUrl = `/assets/manifests/course-${courseSlug}.json`;
      await this.manifestManager.loadManifest(manifestUrl, courseSlug);

      onProgress?.(20, 'Cargando recursos...');

      // Cargar recursos del curso
      await this.manifestManager.loadManifestResources(
        courseSlug,
        (current, total) => {
          const progress = 20 + (current / total) * 70;
          onProgress?.(progress, `Cargando ${current}/${total} recursos...`);
        }
      );

      onProgress?.(90, 'Preparando materiales...');

      this.currentCourse = courseSlug;
      
      // Inicializar progreso si no existe
      if (!this.courseProgress.has(courseSlug)) {
        this.courseProgress.set(courseSlug, {
          courseSlug,
          currentLesson: 1,
          totalLessons: this.getTotalLessons(courseSlug),
          completedLessons: []
        });
      }

      onProgress?.(100, 'Curso listo!');
      console.log(`[Nodo360] ✅ Curso ${courseSlug} cargado exitosamente`);

    } catch (error) {
      console.error(`[Nodo360] ❌ Error cargando curso:`, error);
      throw new Error(`No se pudo cargar el curso: ${courseSlug}`);
    }
  }

  /**
   * Cargar lección específica
   */
  async loadLesson(
    courseSlug: string, 
    lessonNumber: number
  ): Promise<{
    video: any;
    slides: any;
    data: any;
    resources: any;
  }> {
    const lessonId = `${courseSlug}-lesson-${lessonNumber}`;
    
    console.log(`[Nodo360] 📖 Cargando lección ${lessonNumber}...`);

    // Si ya está precargada
    if (this.preloadedLessons.has(lessonId)) {
      console.log(`[Nodo360] ⚡ Lección ${lessonNumber} ya disponible`);
      return this.getLessonResources(courseSlug, lessonNumber);
    }

    // Definir recursos de la lección
    const resources = [
      {
        id: `${lessonId}-video`,
        url: `/assets/courses/${courseSlug}/lesson-${lessonNumber}/video.mp4`,
        type: ResourceType.VIDEO,
        priority: ResourcePriority.CRITICAL
      },
      {
        id: `${lessonId}-slides`,
        url: `/assets/courses/${courseSlug}/lesson-${lessonNumber}/slides.pdf`,
        type: ResourceType.BINARY,
        priority: ResourcePriority.HIGH
      },
      {
        id: `${lessonId}-data`,
        url: `/assets/courses/${courseSlug}/lesson-${lessonNumber}/data.json`,
        type: ResourceType.JSON,
        priority: ResourcePriority.HIGH
      },
      {
        id: `${lessonId}-resources`,
        url: `/assets/courses/${courseSlug}/lesson-${lessonNumber}/resources.json`,
        type: ResourceType.JSON,
        priority: ResourcePriority.MEDIUM
      }
    ];

    // Cargar todos los recursos
    await this.library.loadBatch(resources);
    this.preloadedLessons.add(lessonId);

    // Actualizar progreso del curso
    this.updateCourseProgress(courseSlug, lessonNumber);

    console.log(`[Nodo360] ✅ Lección ${lessonNumber} cargada`);

    return this.getLessonResources(courseSlug, lessonNumber);
  }

  /**
   * Precargar siguiente lección en background
   */
  preloadNextLesson(courseSlug: string, currentLesson: number): void {
    const nextLesson = currentLesson + 1;
    const progress = this.courseProgress.get(courseSlug);

    // No precargar si es la última lección
    if (progress && nextLesson > progress.totalLessons) {
      console.log(`[Nodo360] ℹ️ Última lección alcanzada`);
      return;
    }

    const nextLessonId = `${courseSlug}-lesson-${nextLesson}`;

    // No precargar si ya está cargada
    if (this.preloadedLessons.has(nextLessonId)) {
      return;
    }

    console.log(`[Nodo360] ⏩ Precargando lección ${nextLesson}...`);

    // Precargar después de 2 segundos
    setTimeout(async () => {
      try {
        await this.loadLesson(courseSlug, nextLesson);
        console.log(`[Nodo360] ✅ Lección ${nextLesson} precargada`);
      } catch (error) {
        console.warn(`[Nodo360] ⚠️ No se pudo precargar lección ${nextLesson}`);
      }
    }, 2000);
  }

  /**
   * Marcar lección como completada
   */
  markLessonCompleted(courseSlug: string, lessonNumber: number): void {
    const progress = this.courseProgress.get(courseSlug);
    if (progress && !progress.completedLessons.includes(lessonNumber)) {
      progress.completedLessons.push(lessonNumber);
      progress.currentLesson = Math.max(progress.currentLesson, lessonNumber + 1);
      
      console.log(`[Nodo360] ✓ Lección ${lessonNumber} completada`);
      
      // Guardar en localStorage
      this.saveCourseProgress(courseSlug);
    }
  }

  /**
   * Obtener recursos de una lección
   */
  private getLessonResources(courseSlug: string, lessonNumber: number) {
    const lessonId = `${courseSlug}-lesson-${lessonNumber}`;
    
    return {
      video: this.library.get(`${lessonId}-video`),
      slides: this.library.get(`${lessonId}-slides`),
      data: this.library.get(`${lessonId}-data`),
      resources: this.library.get(`${lessonId}-resources`)
    };
  }

  /**
   * Cargar assets de comunidad
   */
  async loadCommunityAssets(): Promise<void> {
    console.log('[Nodo360] 👥 Cargando assets de comunidad...');

    await this.manifestManager.loadManifest(
      '/assets/manifests/community-assets.json',
      'community'
    );

    await this.manifestManager.loadManifestResources('community');
    
    console.log('[Nodo360] ✅ Assets de comunidad cargados');
  }

  /**
   * Cargar avatar de usuario con caché
   */
  async loadUserAvatar(userId: string, avatarUrl: string): Promise<any> {
    const avatarId = `avatar-${userId}`;
    
    // Verificar si ya está en caché
    const cached = this.library.get(avatarId);
    if (cached) {
      return cached;
    }

    return await this.library.load({
      id: avatarId,
      url: avatarUrl,
      type: ResourceType.IMAGE,
      cache: true,
      priority: ResourcePriority.LOW
    });
  }

  /**
   * Cargar recursos de proyecto
   */
  async loadProjectResources(projectId: string): Promise<void> {
    console.log(`[Nodo360] 🚀 Cargando proyecto: ${projectId}`);

    const manifestUrl = `/assets/manifests/project-${projectId}.json`;
    
    await this.manifestManager.loadManifest(manifestUrl, `project-${projectId}`);
    await this.manifestManager.loadManifestResources(`project-${projectId}`);
    
    console.log(`[Nodo360] ✅ Proyecto ${projectId} cargado`);
  }

  /**
   * Limpiar curso actual
   */
  clearCurrentCourse(): void {
    if (this.currentCourse) {
      console.log(`[Nodo360] 🧹 Limpiando curso: ${this.currentCourse}`);
      
      const resources = this.manifestManager.getManifestResources(this.currentCourse);
      
      resources.forEach(resource => {
        this.library.unload(resource.id);
      });

      this.preloadedLessons.clear();
      this.currentCourse = null;
      
      console.log('[Nodo360] ✅ Curso limpiado');
    }
  }

  /**
   * Obtener progreso del curso
   */
  getCourseProgress(courseSlug: string): CourseProgress | undefined {
    return this.courseProgress.get(courseSlug);
  }

  /**
   * Obtener recurso por ID
   */
  getResource(id: string): any {
    return this.library.get(id);
  }

  /**
   * Verificar si un recurso existe
   */
  hasResource(id: string): boolean {
    return this.library.has(id);
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const stats = this.library.getStats();
    return {
      ...stats,
      currentCourse: this.currentCourse,
      preloadedLessons: this.preloadedLessons.size,
      coursesInProgress: this.courseProgress.size
    };
  }

  /**
   * Guardar progreso en localStorage
   */
  private saveCourseProgress(courseSlug: string): void {
    if (typeof window !== 'undefined') {
      const progress = this.courseProgress.get(courseSlug);
      if (progress) {
        localStorage.setItem(
          `nodo360-course-${courseSlug}`,
          JSON.stringify(progress)
        );
      }
    }
  }

  /**
   * Cargar progreso desde localStorage
   */
  loadSavedProgress(courseSlug: string): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`nodo360-course-${courseSlug}`);
      if (saved) {
        try {
          const progress = JSON.parse(saved);
          this.courseProgress.set(courseSlug, progress);
          console.log(`[Nodo360] 📚 Progreso cargado: ${courseSlug}`);
        } catch (error) {
          console.warn('[Nodo360] ⚠️ Error cargando progreso guardado');
        }
      }
    }
  }

  /**
   * Actualizar progreso del curso
   */
  private updateCourseProgress(courseSlug: string, lessonNumber: number): void {
    const progress = this.courseProgress.get(courseSlug);
    if (progress) {
      progress.currentLesson = Math.max(progress.currentLesson, lessonNumber);
    }
  }

  /**
   * Obtener total de lecciones (helper)
   */
  private getTotalLessons(courseSlug: string): number {
    // Obtener del manifiesto o configuración
    const resources = this.manifestManager.getManifestResources(courseSlug);
    const lessonResources = resources.filter(r => r.id.includes('lesson-'));
    return Math.max(...lessonResources.map(r => {
      const match = r.id.match(/lesson-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
  }

  /**
   * Tracking (integrar con tu analytics)
   */
  private trackResourceLoad(id: string, type: string): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('nodo360_resource_loaded', {
        resourceId: id,
        resourceType: type,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Tracking de errores
   */
  private trackResourceError(id: string, error: Error): void {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('nodo360_resource_error', {
        resourceId: id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Exportar instancia singleton
export const nodo360Resources = Nodo360ResourceManager.getInstance();


