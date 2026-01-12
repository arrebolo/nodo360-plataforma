// app/(private)/layout.tsx
import type { ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dark text-white">
      {children}
    </div>
  );
}


