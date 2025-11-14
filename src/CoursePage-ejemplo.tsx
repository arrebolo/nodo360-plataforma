/**
 * CoursePage.tsx
 * Componente de ejemplo listo para usar en Nodo360
 * 
 * INSTRUCCIONES:
 * - Para Next.js 13+: Copia a app/courses/[slug]/page.tsx
 * - Para Next.js Pages: Copia a pages/courses/[slug].tsx
 * - Para React: Usa con React Router
 */

'use client'; // Para Next.js 13+, eliminar si usas Pages Router

import { useEffect, useState } from 'react';
import { Nodo360ResourceManager } from '@/core/Nodo360ResourceManager';

// Crear instancia global del gestor de recursos
const resourceManager = Nodo360ResourceManager.getInstance({
  cacheSize: 300,  // 300MB de caché
  baseURL: '/assets'
});

interface CoursePageProps {
  params: { slug: string };  // Para Next.js App Router
  // slug: string;  // Para React Router, descomenta y usa props
}

export default function CoursePage({ params }: CoursePageProps) {
  const courseSlug = params.slug; // Para Next.js
  // const { slug: courseSlug } = props; // Para React Router

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Iniciando...');
  const [currentLesson, setCurrentLesson] = useState(1);
  const [lessonData, setLessonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar curso al montar componente
  useEffect(() => {
    loadCourse();

    // Cleanup: limpiar recursos al desmontar
    return () => {
      resourceManager.clearCurrentCourse();
    };
  }, [courseSlug]);

  // Cargar lección cuando cambia el número
  useEffect(() => {
    if (!loading) {
      loadLesson(currentLesson);
    }
  }, [currentLesson, loading]);

  /**
   * Cargar curso completo
   */
  async function loadCourse() {
    try {
      setLoading(true);
      setError(null);

      // Cargar progreso guardado
      resourceManager.loadSavedProgress(courseSlug);
      const savedProgress = resourceManager.getCourseProgress(courseSlug);
      
      if (savedProgress) {
        setCurrentLesson(savedProgress.currentLesson);
      }

      // Cargar curso con callback de progreso
      await resourceManager.loadCourse(
        courseSlug,
        (progress, status) => {
          setLoadingProgress(progress);
          setLoadingStatus(status);
        }
      );

      // Cargar primera lección
      await loadLesson(currentLesson);

      setLoading(false);

      // Precargar siguiente lección en background
      resourceManager.preloadNextLesson(courseSlug, currentLesson);

    } catch (err: any) {
      console.error('Error cargando curso:', err);
      setError(err.message || 'Error cargando el curso');
      setLoading(false);
    }
  }

  /**
   * Cargar lección específica
   */
  async function loadLesson(lessonNumber: number) {
    try {
      const resources = await resourceManager.loadLesson(courseSlug, lessonNumber);
      setLessonData(resources);

      // Precargar siguiente lección
      resourceManager.preloadNextLesson(courseSlug, lessonNumber);

    } catch (err: any) {
      console.error('Error cargando lección:', err);
      setError(`Error cargando lección ${lessonNumber}`);
    }
  }

  /**
   * Ir a la siguiente lección
   */
  function handleNextLesson() {
    const progress = resourceManager.getCourseProgress(courseSlug);
    if (progress && currentLesson < progress.totalLessons) {
      // Marcar lección actual como completada
      resourceManager.markLessonCompleted(courseSlug, currentLesson);
      
      // Avanzar a siguiente lección
      setCurrentLesson(currentLesson + 1);
    } else {
      alert('¡Has completado todas las lecciones! 🎉');
    }
  }

  /**
   * Ir a la lección anterior
   */
  function handlePreviousLesson() {
    if (currentLesson > 1) {
      setCurrentLesson(currentLesson - 1);
    }
  }

  /**
   * Marcar lección como completada
   */
  function handleMarkAsCompleted() {
    resourceManager.markLessonCompleted(courseSlug, currentLesson);
    alert(`Lección ${currentLesson} marcada como completada ✓`);
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <h1>🚀 Nodo360</h1>
          <h2>Cargando curso...</h2>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          <p className="loading-status">
            {loadingStatus} ({Math.round(loadingProgress)}%)
          </p>
        </div>

        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .loading-container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 90%;
          }

          h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
          }

          h2 {
            color: #666;
            margin-bottom: 2rem;
          }

          .progress-bar {
            width: 100%;
            height: 30px;
            background: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 1rem 0;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
          }

          .loading-status {
            color: #666;
            margin-top: 1rem;
          }
        `}</style>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="error-screen">
        <div className="error-container">
          <h1>❌ Error</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>

        <style jsx>{`
          .error-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 2rem;
          }
          
          .error-container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }

          h1 {
            color: #e53e3e;
            margin-bottom: 1rem;
          }

          button {
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1rem;
          }

          button:hover {
            background: #764ba2;
          }
        `}</style>
      </div>
    );
  }

  // Obtener progreso del curso
  const progress = resourceManager.getCourseProgress(courseSlug);

  // Pantalla principal del curso
  return (
    <div className="course-page">
      {/* Header del curso */}
      <header className="course-header">
        <h1>📚 {courseSlug.replace(/-/g, ' ').toUpperCase()}</h1>
        {progress && (
          <div className="course-progress-info">
            <span>Lección {currentLesson} de {progress.totalLessons}</span>
            <span> | </span>
            <span>Completadas: {progress.completedLessons.length}</span>
          </div>
        )}
      </header>

      {/* Contenido de la lección */}
      <main className="lesson-content">
        {lessonData && (
          <>
            {/* Video de la lección */}
            {lessonData.video && (
              <div className="video-container">
                <video
                  src={lessonData.video.src || lessonData.video}
                  controls
                  width="100%"
                  autoPlay
                />
              </div>
            )}

            {/* Información de la lección */}
            {lessonData.data && (
              <div className="lesson-info">
                <h2>{lessonData.data.title || `Lección ${currentLesson}`}</h2>
                <p>{lessonData.data.description}</p>
              </div>
            )}

            {/* Recursos descargables */}
            {lessonData.slides && (
              <div className="lesson-resources">
                <h3>📄 Recursos de la lección</h3>
                <a 
                  href={lessonData.slides} 
                  download
                  className="download-btn"
                >
                  Descargar Presentación (PDF)
                </a>
              </div>
            )}

            {/* Quiz o ejercicios (si los hay) */}
            {lessonData.data?.hasQuiz && (
              <div className="quiz-section">
                <h3>✏️ Quiz de la lección</h3>
                <p>Completa el quiz para validar tu aprendizaje</p>
                <button className="quiz-btn">Iniciar Quiz</button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Controles de navegación */}
      <footer className="lesson-controls">
        <button
          onClick={handlePreviousLesson}
          disabled={currentLesson === 1}
          className="control-btn"
        >
          ← Anterior
        </button>

        <button
          onClick={handleMarkAsCompleted}
          className="control-btn complete-btn"
        >
          ✓ Completar
        </button>

        <button
          onClick={handleNextLesson}
          disabled={progress ? currentLesson >= progress.totalLessons : false}
          className="control-btn primary"
        >
          Siguiente →
        </button>
      </footer>

      {/* Estilos */}
      <style jsx>{`
        .course-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .course-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #eee;
        }

        .course-header h1 {
          margin-bottom: 0.5rem;
          color: #667eea;
        }

        .course-progress-info {
          color: #666;
          font-size: 0.9rem;
        }

        .lesson-content {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .video-container {
          margin-bottom: 2rem;
          border-radius: 10px;
          overflow: hidden;
        }

        .video-container video {
          display: block;
        }

        .lesson-info h2 {
          color: #333;
          margin-bottom: 1rem;
        }

        .lesson-info p {
          color: #666;
          line-height: 1.6;
        }

        .lesson-resources {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #eee;
        }

        .lesson-resources h3 {
          margin-bottom: 1rem;
        }

        .download-btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 10px;
          transition: background 0.2s;
        }

        .download-btn:hover {
          background: #764ba2;
        }

        .quiz-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .quiz-btn {
          margin-top: 1rem;
          padding: 0.75rem 2rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
        }

        .quiz-btn:hover {
          background: #218838;
        }

        .lesson-controls {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .control-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover:not(:disabled) {
          background: #667eea;
          color: white;
        }

        .control-btn.primary {
          background: #667eea;
          color: white;
        }

        .control-btn.primary:hover:not(:disabled) {
          background: #764ba2;
          border-color: #764ba2;
        }

        .control-btn.complete-btn {
          border-color: #28a745;
          color: #28a745;
        }

        .control-btn.complete-btn:hover {
          background: #28a745;
          color: white;
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .course-page {
            padding: 1rem;
          }

          .lesson-controls {
            flex-direction: column;
          }

          .control-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
