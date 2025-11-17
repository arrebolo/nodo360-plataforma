"use client";

import { motion } from "framer-motion";
import { Crown, Check, Sparkles, Zap, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PremiumUpgradeBannerProps {
  variant?: "default" | "compact" | "module-lock";
  moduleTitle?: string;
  onUpgrade?: () => void;
}

/**
 * PremiumUpgradeBanner Component
 *
 * Displays upgrade prompt for free users trying to access premium content
 *
 * Variants:
 * - default: Full banner with all benefits
 * - compact: Smaller version for inline display
 * - module-lock: Specific for locked modules
 *
 * @example
 * ```tsx
 * <PremiumUpgradeBanner variant="module-lock" moduleTitle="Módulo 2" />
 * <PremiumUpgradeBanner variant="compact" />
 * ```
 */
export function PremiumUpgradeBanner({
  variant = "default",
  moduleTitle,
  onUpgrade,
}: PremiumUpgradeBannerProps) {
  const benefits = [
    {
      icon: Crown,
      title: "Acceso completo",
      description: "Todos los módulos y lecciones sin límites",
    },
    {
      icon: Award,
      title: "Certificados verificables",
      description: "Certific ados oficiales por cada módulo completado",
    },
    {
      icon: Zap,
      title: "Contenido actualizado",
      description: "Acceso a nuevos cursos y actualizaciones",
    },
    {
      icon: Sparkles,
      title: "Soporte prioritario",
      description: "Asistencia directa del equipo",
    },
  ];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Redirect to pricing or upgrade page
      window.location.href = "/premium";
    }
  };

  // Module Lock Variant
  if (variant === "module-lock") {
    return (
      <motion.div
        className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-3">
            {moduleTitle ? `${moduleTitle} es Premium` : "Contenido Premium"}
          </h3>

          {/* Description */}
          <p className="text-white/70 mb-6">
            Actualiza a Premium para acceder a todos los módulos, certificados
            verificables y contenido exclusivo.
          </p>

          {/* Quick Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Check className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-xs text-white/80">Todos los módulos</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xs text-white/80">Certificados</p>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            onClick={handleUpgrade}
            className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Crown className="w-5 h-5" />
            Actualizar a Premium
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Price Note */}
          <p className="text-sm text-white/50 mt-4">
            Desde $9.99/mes • Cancela cuando quieras
          </p>
        </div>
      </motion.div>
    );
  }

  // Compact Variant
  if (variant === "compact") {
    return (
      <motion.div
        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold mb-1">
              Desbloquea todo con Premium
            </h4>
            <p className="text-sm text-white/60">
              Acceso completo a todos los cursos
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex-shrink-0"
          >
            Actualizar
          </button>
        </div>
      </motion.div>
    );
  }

  // Default Variant - Full Banner
  return (
    <motion.div
      className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-purple-900/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12 overflow-hidden relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500 rounded-full filter blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">
              Oferta Premium
            </span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Desbloquea Todo el Potencial
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Accede a todos los cursos, certificados verificables y contenido
            exclusivo con Premium
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      {benefit.description}
                    </p>
                  </div>
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.button
            onClick={handleUpgrade}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Crown className="w-6 h-6" />
            Actualizar a Premium Ahora
            <ArrowRight className="w-6 h-6" />
          </motion.button>

          <p className="text-white/50 mt-4">
            💳 Desde $9.99/mes • ✨ Cancela cuando quieras • 🔒 Pago seguro
          </p>

          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/40">
            <span>✓ 30 días de garantía</span>
            <span>✓ Sin compromisos</span>
            <span>✓ Acceso inmediato</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
