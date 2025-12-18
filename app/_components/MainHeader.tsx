import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";

export default function MainHeader() {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-white font-bold text-xl">NODO360</span>
          </Link>

          {/* Navegación principal */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/cursos" className="text-white/70 hover:text-white transition">
              Cursos
            </Link>
            <Link href="/formadores" className="text-white/70 hover:text-white transition">
              Formadores
            </Link>
            <Link href="/gobernanza" className="text-white/70 hover:text-white transition">
              Gobernanza
            </Link>
          </nav>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
