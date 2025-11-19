"use client";

import { Lock, Unlock, CheckCircle2, BookOpen, Crown } from "lucide-react";
import { motion } from "framer-motion";

export type ModuleStatus =
  | "unlocked" // Accessible
  | "locked" // Needs previous module
  | "completed" // Quiz passed
  | "in_progress" // Some lessons completed
  | "premium"; // Requires upgrade

interface ModuleStatusBadgeProps {
  status: ModuleStatus;
  completedLessons?: number;
  totalLessons?: number;
  isCompact?: boolean;
}

/**
 * ModuleStatusBadge Component
 *
 * Visual indicator for module access status
 *
 * States:
 * - unlocked: Module is accessible
 * - locked: Needs to complete previous module
 * - completed: Quiz passed successfully
 * - in_progress: Currently working on lessons
 * - premium: Requires subscription upgrade
 *
 * @example
 * ```tsx
 * <ModuleStatusBadge status="completed" />
 * <ModuleStatusBadge
 *   status="in_progress"
 *   completedLessons={3}
 *   totalLessons={5}
 * />
 * <ModuleStatusBadge status="locked" />
 * ```
 */
export function ModuleStatusBadge({
  status,
  completedLessons,
  totalLessons,
  isCompact = false,
}: ModuleStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          label: "Quiz Completado",
          bgColor: "from-green-500/20 to-emerald-500/20",
          borderColor: "border-green-500/30",
          textColor: "text-green-400",
          iconColor: "text-green-400",
        };
      case "unlocked":
        return {
          icon: Unlock,
          label: "Desbloqueado",
          bgColor: "from-blue-500/20 to-cyan-500/20",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-400",
          iconColor: "text-blue-400",
        };
      case "locked":
        return {
          icon: Lock,
          label: "Bloqueado",
          subtitle: "Completa el quiz del módulo anterior",
          bgColor: "from-gray-500/20 to-slate-500/20",
          borderColor: "border-gray-500/30",
          textColor: "text-gray-400",
          iconColor: "text-gray-400",
        };
      case "in_progress":
        return {
          icon: BookOpen,
          label: `${completedLessons}/${totalLessons} lecciones`,
          subtitle: "En progreso",
          bgColor: "from-[#ff6b35]/20 to-[#f7931a]/20",
          borderColor: "border-[#ff6b35]/30",
          textColor: "text-[#ff6b35]",
          iconColor: "text-[#ff6b35]",
        };
      case "premium":
        return {
          icon: Crown,
          label: "Premium",
          subtitle: "Actualiza para desbloquear",
          bgColor: "from-purple-500/20 to-pink-500/20",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-400",
          iconColor: "text-purple-400",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  if (isCompact) {
    return (
      <motion.div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.bgColor} border ${config.borderColor}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-xs font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${config.bgColor} border ${config.borderColor}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}
      >
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
      </div>
      <div className="flex-1">
        <div className={`font-semibold ${config.textColor}`}>
          {config.label}
        </div>
        {config.subtitle && (
          <div className={`text-xs ${config.textColor} opacity-80`}>
            {config.subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * ModuleStatusIndicator - Simpler version for lists
 */
interface ModuleStatusIndicatorProps {
  status: ModuleStatus;
  showLabel?: boolean;
}

export function ModuleStatusIndicator({
  status,
  showLabel = true,
}: ModuleStatusIndicatorProps) {
  const getIndicatorConfig = () => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          label: "✓",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
        };
      case "unlocked":
        return {
          icon: Unlock,
          label: "○",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
        };
      case "locked":
        return {
          icon: Lock,
          label: "●",
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
        };
      case "in_progress":
        return {
          icon: BookOpen,
          label: "◐",
          color: "text-[#ff6b35]",
          bgColor: "bg-[#ff6b35]/20",
        };
      case "premium":
        return {
          icon: Crown,
          label: "♛",
          color: "text-purple-400",
          bgColor: "bg-purple-500/20",
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.bgColor}`}
      title={status}
    >
      <Icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
}
