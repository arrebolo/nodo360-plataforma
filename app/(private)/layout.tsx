// app/(private)/layout.tsx
import type { ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Capa sutil (NO gradiente visible, solo profundidad mínima) */}
      <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(255,255,255,0.06),transparent_70%)]">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
