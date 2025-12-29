export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141821] text-white">
      {/* Fondo neutro (educativo) + halo suave arriba (muy sutil) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6d28d9]/12 via-[#4338ca]/10 to-[#1d4ed8]/8 blur-[90px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#141821]/35 to-[#141821]" />
      </div>

      {children}
    </div>
  );
}
