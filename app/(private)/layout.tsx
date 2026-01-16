// app/(private)/layout.tsx
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import BetaBanner from "@/components/beta/BetaBanner";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // Obtener perfil para verificar si es beta y su rol
  let showBetaBanner = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_beta, role')
      .eq('id', user.id)
      .single();

    // Mostrar banner solo para usuarios beta que no sean admin
    showBetaBanner = profile?.is_beta && profile?.role !== 'admin';
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Banner solo para usuarios beta (no admins) */}
      {user && showBetaBanner && (
        <BetaBanner
          userEmail={user.email || ''}
          userId={user.id}
        />
      )}

      {children}
    </div>
  );
}
