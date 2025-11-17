'use client'

import { useState } from 'react'

interface Reply {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: number
  isInstructor?: boolean
}

interface Discussion {
  id: string
  userId: string
  userName: string
  userAvatar: string
  question: string
  timestamp: number
  replies: Reply[]
  resolved?: boolean
}

// Mock data
const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: 'disc-1',
    userId: 'user-1',
    userName: 'Carlos Méndez',
    userAvatar: 'https://ui-avatars.com/api/?name=Carlos+Mendez&background=FFD700&color=1a1f2e',
    question: '¿Cuál es la diferencia principal entre una wallet custodial y no custodial?',
    timestamp: Date.now() - 86400000 * 2, // 2 days ago
    resolved: true,
    replies: [
      {
        id: 'reply-1',
        userId: 'instructor-1',
        userName: 'Instructor',
        userAvatar: 'https://ui-avatars.com/api/?name=Instructor&background=ff6b35&color=fff',
        content: 'Excelente pregunta. La diferencia clave es el control de las claves privadas. En una wallet custodial, un tercero (exchange o plataforma) guarda tus claves. En una no custodial, tú tienes el control total de tus claves privadas.',
        timestamp: Date.now() - 86400000 * 2 + 3600000,
        isInstructor: true,
      },
      {
        id: 'reply-2',
        userId: 'user-1',
        userName: 'Carlos Méndez',
        userAvatar: 'https://ui-avatars.com/api/?name=Carlos+Mendez&background=FFD700&color=1a1f2e',
        content: '¡Perfecto! Ahora lo entiendo. Gracias por la explicación.',
        timestamp: Date.now() - 86400000 * 2 + 7200000,
      },
    ],
  },
  {
    id: 'disc-2',
    userId: 'user-2',
    userName: 'María González',
    userAvatar: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=4ade80&color=1a1f2e',
    question: '¿Qué pasa si pierdo mi frase semilla? ¿Hay alguna forma de recuperar mis fondos?',
    timestamp: Date.now() - 86400000, // 1 day ago
    replies: [
      {
        id: 'reply-3',
        userId: 'instructor-1',
        userName: 'Instructor',
        userAvatar: 'https://ui-avatars.com/api/?name=Instructor&background=ff6b35&color=fff',
        content: 'Desafortunadamente, si pierdes tu frase semilla y no tienes un respaldo, no hay forma de recuperar tus fondos. Por eso es CRÍTICO guardar tu frase semilla en un lugar seguro y hacer múltiples copias de seguridad en diferentes ubicaciones físicas.',
        timestamp: Date.now() - 86400000 + 1800000,
        isInstructor: true,
      },
    ],
  },
]

interface DiscussionSectionProps {
  lessonId: string
}

export function DiscussionSection({ lessonId }: DiscussionSectionProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>(MOCK_DISCUSSIONS)
  const [isAsking, setIsAsking] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor(diff / 60000)

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    return 'hace un momento'
  }

  const addQuestion = () => {
    if (!newQuestion.trim()) return

    const newDiscussion: Discussion = {
      id: `disc-${Date.now()}`,
      userId: 'user-current',
      userName: 'Tú',
      userAvatar: 'https://ui-avatars.com/api/?name=Tu&background=3b82f6&color=fff',
      question: newQuestion,
      timestamp: Date.now(),
      replies: [],
    }

    setDiscussions([newDiscussion, ...discussions])
    setNewQuestion('')
    setIsAsking(false)
  }

  const addReply = (discussionId: string) => {
    if (!replyContent.trim()) return

    const newReply: Reply = {
      id: `reply-${Date.now()}`,
      userId: 'user-current',
      userName: 'Tú',
      userAvatar: 'https://ui-avatars.com/api/?name=Tu&background=3b82f6&color=fff',
      content: replyContent,
      timestamp: Date.now(),
    }

    setDiscussions(
      discussions.map((disc) =>
        disc.id === discussionId
          ? { ...disc, replies: [...disc.replies, newReply] }
          : disc
      )
    )
    setReplyContent('')
    setReplyingTo(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Discusión
        </h3>
        <button
          onClick={() => setIsAsking(!isAsking)}
          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium text-sm rounded-lg transition-colors"
        >
          Hacer Pregunta
        </button>
      </div>

      {/* Ask Question Form */}
      {isAsking && (
        <div className="bg-gray-800 rounded-lg p-4 border border-yellow-500/30">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="¿Qué quieres preguntar sobre esta lección?"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                setIsAsking(false)
                setNewQuestion('')
              }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={addQuestion}
              className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium text-sm rounded-lg transition-colors"
            >
              Publicar Pregunta
            </button>
          </div>
        </div>
      )}

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aún no hay preguntas. ¡Sé el primero en preguntar!
          </p>
        ) : (
          discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Question */}
              <div className="flex items-start gap-3">
                <img
                  src={discussion.userAvatar}
                  alt={discussion.userName}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {discussion.userName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(discussion.timestamp)}
                    </span>
                    {discussion.resolved && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Resuelto
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{discussion.question}</p>

                  {/* Replies */}
                  {discussion.replies.length > 0 && (
                    <div className="space-y-3 mt-4 pl-4 border-l-2 border-gray-700">
                      {discussion.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <img
                            src={reply.userAvatar}
                            alt={reply.userName}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm">
                                {reply.userName}
                              </span>
                              {reply.isInstructor && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                  Instructor
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(reply.timestamp)}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === discussion.id ? (
                    <div className="mt-3 pl-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent('')
                          }}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => addReply(discussion.id)}
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium text-xs rounded-lg transition-colors"
                        >
                          Responder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(discussion.id)}
                      className="mt-3 text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Responder
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
