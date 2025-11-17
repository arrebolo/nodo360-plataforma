"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import type { QuizQuestion } from "@/types/database";
import confetti from "canvas-confetti";

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>, timeSpent: number) => Promise<void>;
  onCancel?: () => void;
  showTimer?: boolean;
  timeLimit?: number; // in minutes
}

/**
 * QuizInterface Component
 *
 * Interactive quiz interface with animations and progress tracking
 *
 * Features:
 * - Question navigation with smooth animations
 * - Progress bar
 * - Answer selection with visual feedback
 * - Optional timer
 * - Confirmation before submit
 * - Keyboard shortcuts
 *
 * @example
 * ```tsx
 * <QuizInterface
 *   questions={quizQuestions}
 *   onSubmit={handleSubmit}
 *   onCancel={() => router.back()}
 *   showTimer={true}
 *   timeLimit={15}
 * />
 * ```
 */
export function QuizInterface({
  questions,
  onSubmit,
  onCancel,
  showTimer = false,
  timeLimit,
}: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(
    timeLimit ? timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;
  const progress = (answeredCount / totalQuestions) * 100;

  // Timer countdown
  useEffect(() => {
    if (!showTimer || !timeRemaining) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimer, timeRemaining]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Select answer
  const selectAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answerIndex,
      }));
    },
    []
  );

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setDirection("forward");
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection("backward");
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToQuestion = useCallback((index: number) => {
    setDirection(index > currentIndex ? "forward" : "backward");
    setCurrentIndex(index);
  }, [currentIndex]);

  // Auto-submit when time runs out
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setIsSubmitting(true);
    await onSubmit(answers, timeSpent);
  }, [answers, startTime, isSubmitting, onSubmit]);

  // Manual submit
  const handleSubmit = useCallback(async () => {
    if (!allAnswered || isSubmitting) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setIsSubmitting(true);

    try {
      await onSubmit(answers, timeSpent);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setIsSubmitting(false);
    }
  }, [allAnswered, answers, startTime, isSubmitting, onSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showConfirmation) return;

      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key >= "1" && e.key <= "4") {
        const index = parseInt(e.key) - 1;
        if (index < currentQuestion.options.length) {
          selectAnswer(currentQuestion.id, index);
        }
      } else if (e.key === "Enter" && allAnswered) {
        setShowConfirmation(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentQuestion,
    goToPrevious,
    goToNext,
    selectAnswer,
    allAnswered,
    showConfirmation,
  ]);

  // Animation variants
  const slideVariants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Quiz del Módulo
          </h1>
          {showTimer && timeRemaining !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 60
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-white"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>
              Pregunta {currentIndex + 1} de {totalQuestions}
            </span>
            <span>
              {answeredCount}/{totalQuestions} respondidas
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex flex-wrap gap-2 mb-6">
        {questions.map((q, index) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                isCurrent
                  ? "bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white scale-110 shadow-lg"
                  : isAnswered
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/50 border border-white/10 hover:border-white/30"
              }`}
              title={`Pregunta ${index + 1}${isAnswered ? " (respondida)" : ""}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card with Animation */}
      <div className="mb-6 relative" style={{ minHeight: "400px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 sm:p-8"
          >
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {currentIndex + 1}
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white flex-1">
                  {currentQuestion.question}
                </h2>
              </div>

              {currentQuestion.difficulty && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-500/20 text-green-400"
                      : currentQuestion.difficulty === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {currentQuestion.difficulty === "easy"
                    ? "Fácil"
                    : currentQuestion.difficulty === "medium"
                      ? "Medio"
                      : "Difícil"}
                </span>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === index;
                const optionLabel = String.fromCharCode(65 + index);

                return (
                  <motion.button
                    key={index}
                    onClick={() => selectAnswer(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-[#ff6b35] bg-[#ff6b35]/10 shadow-lg"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-[#ff6b35] bg-[#ff6b35]"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30" />
                        )}
                      </div>
                      <span className="text-white/90 font-medium mr-2">
                        {optionLabel}.
                      </span>
                      <span className="text-white/90 flex-1">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Hint */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">
                  💡 Tip: Usa las teclas 1-4 para seleccionar opciones y las
                  flechas para navegar entre preguntas.
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {currentIndex < totalQuestions - 1 && (
            <button
              onClick={goToNext}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 sm:px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          )}

          <motion.button
            onClick={() => setShowConfirmation(true)}
            disabled={!allAnswered || isSubmitting}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            whileHover={allAnswered ? { scale: 1.05 } : {}}
            whileTap={allAnswered ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
            <span>Enviar Quiz</span>
          </motion.button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Enviar Quiz?
              </h3>
              <p className="text-white/70 mb-6">
                Has respondido {answeredCount} de {totalQuestions} preguntas.
                Una vez enviado, no podrás cambiar tus respuestas.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  Revisar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
