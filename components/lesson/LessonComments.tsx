'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  MessageCircle,
  Send,
  CheckCircle,
  Pencil,
  EyeOff,
  Loader2,
  User,
} from 'lucide-react'

interface CommentUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
}

interface Comment {
  id: string
  lesson_id: string
  user_id: string
  content: string
  is_hidden: boolean
  is_answer: boolean
  created_at: string
  updated_at: string
  user: CommentUser
}

interface LessonCommentsProps {
  lessonId: string
  courseInstructorId: string | null
  userId: string
  userRole: string
}

const roleBadges: Record<string, { label: string; color: string }> = {
  instructor: { label: 'Instructor', color: 'bg-brand-light/20 text-brand-light' },
  mentor: { label: 'Mentor', color: 'bg-purple-500/20 text-purple-400' },
  admin: { label: 'Admin', color: 'bg-red-500/20 text-red-400' },
  council: { label: 'Consejo', color: 'bg-amber-500/20 text-amber-400' },
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function LessonComments({
  lessonId,
  courseInstructorId,
  userId,
  userRole,
}: LessonCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const isAdmin = userRole === 'admin'
  const isInstructor = courseInstructorId === userId
  const canMarkAnswer = isAdmin || isInstructor || ['mentor', 'council'].includes(userRole)

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Submit new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.data])
        setNewComment('')
      } else {
        const error = await res.json()
        alert(error.error || 'Error al enviar comentario')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Error al enviar comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit comment
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })

      if (res.ok) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, content: editContent.trim() } : c
          )
        )
        setEditingId(null)
        setEditContent('')
      } else {
        const error = await res.json()
        alert(error.error || 'Error al editar')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  // Toggle answer
  const handleToggleAnswer = async (commentId: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_answer: !currentValue }),
      })

      if (res.ok) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, is_answer: !currentValue } : c
          )
        )
      }
    } catch (error) {
      console.error('Error toggling answer:', error)
    }
  }

  // Hide comment (admin)
  const handleHide = async (commentId: string) => {
    if (!confirm('¿Ocultar este comentario?')) return

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: true }),
      })

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error hiding comment:', error)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-brand-light" />
        <h3 className="text-lg font-semibold text-white">
          Comentarios {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comments.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Se el primero en comentar</p>
        </div>
      )}

      {/* Comments list */}
      {!isLoading && comments.length > 0 && (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => {
            const isAuthor = comment.user_id === userId
            const badge = roleBadges[comment.user.role]
            const isEditing = editingId === comment.id

            return (
              <div
                key={comment.id}
                className={`p-4 rounded-xl border ${
                  comment.is_answer
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Comment header */}
                <div className="flex items-start gap-3 mb-2">
                  {/* Avatar */}
                  {comment.user.avatar_url ? (
                    <Image
                      src={comment.user.avatar_url}
                      alt={comment.user.full_name || 'Usuario'}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-white/50" />
                    </div>
                  )}

                  {/* Name and meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white text-sm">
                        {comment.user.full_name || 'Usuario'}
                      </span>
                      {badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      {comment.is_answer && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Respuesta util
                        </span>
                      )}
                      <span className="text-xs text-white/40">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isAuthor && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingId(comment.id)
                          setEditContent(comment.content)
                        }}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canMarkAnswer && (
                      <button
                        onClick={() => handleToggleAnswer(comment.id, comment.is_answer)}
                        className={`p-1.5 rounded-lg transition ${
                          comment.is_answer
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-white/40 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                        title={comment.is_answer ? 'Quitar marca' : 'Marcar como respuesta'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleHide(comment.id)}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Ocultar"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content or edit form */}
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/20 transition resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(comment.id)}
                        className="px-3 py-1.5 bg-brand-light/20 text-brand-light text-sm font-medium rounded-lg hover:bg-brand-light/30 transition"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                        className="px-3 py-1.5 text-white/60 text-sm hover:text-white transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap ml-12">
                    {comment.content}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          maxLength={2000}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light/50 focus:ring-1 focus:ring-brand-light/20 transition resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">
            {newComment.length}/2000
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-brand-light/20 text-brand-light font-medium rounded-lg hover:bg-brand-light/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Comentar
          </button>
        </div>
      </form>
    </div>
  )
}
