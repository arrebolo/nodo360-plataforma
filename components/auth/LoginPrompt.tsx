"use client";

import { useRouter } from "next/navigation";
import { Lock, LogIn, UserPlus } from "lucide-react";

interface LoginPromptProps {
  title?: string;
  message?: string;
  returnUrl?: string;
  variant?: "default" | "compact" | "inline";
  showSignUp?: boolean;
}

/**
 * LoginPrompt Component
 *
 * Displays a prompt for unauthenticated users to log in or sign up
 *
 * @example
 * ```tsx
 * // Default variant
 * <LoginPrompt
 *   title="Acceso Restringido"
 *   message="Debes iniciar sesión para acceder a esta función"
 *   returnUrl="/cursos/blockchain/quiz"
 * />
 *
 * // Compact variant for cards
 * <LoginPrompt
 *   variant="compact"
 *   message="Inicia sesión para continuar"
 * />
 *
 * // Inline variant for embedded contexts
 * <LoginPrompt
 *   variant="inline"
 *   message="Debes estar autenticado"
 * />
 * ```
 */
export function LoginPrompt({
  title = "Inicia Sesión para Continuar",
  message = "Necesitas una cuenta para acceder a esta función. Crea una cuenta gratis o inicia sesión para continuar.",
  returnUrl,
  variant = "default",
  showSignUp = true,
}: LoginPromptProps) {
  const router = useRouter();

  const handleLogin = () => {
    const loginUrl = returnUrl
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/login";
    router.push(loginUrl);
  };

  const handleSignUp = () => {
    const signUpUrl = returnUrl
      ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/signup";
    router.push(signUpUrl);
  };

  // Compact variant (for cards/small spaces)
  if (variant === "compact") {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-light/20 mb-3">
          <Lock className="w-6 h-6 text-brand-light" />
        </div>
        <p className="text-white/70 text-sm mb-4">{message}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-light/20 transition-all"
          >
            Iniciar Sesión
          </button>
          {showSignUp && (
            <button
              onClick={handleSignUp}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all"
            >
              Registrarse
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (for embedded contexts)
  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <Lock className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-200 text-sm">{message}</span>
        <button
          onClick={handleLogin}
          className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-300 text-sm font-medium hover:bg-yellow-500/30 transition-all"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  // Default variant (full card)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-brand-light/20 to-brand/20 mb-6">
          <Lock className="w-10 h-10 text-brand-light" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

        {/* Message */}
        <p className="text-white/70 mb-8 max-w-md mx-auto">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-light to-brand text-white font-semibold hover:shadow-lg hover:shadow-brand-light/50 transition-all"
          >
            <LogIn className="w-5 h-5" />
            Iniciar Sesión
          </button>

          {showSignUp && (
            <button
              onClick={handleSignUp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Crear Cuenta Gratis
            </button>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-white/50">
            🔒 Tu información está protegida y segura
          </p>
        </div>
      </div>
    </div>
  );
}


