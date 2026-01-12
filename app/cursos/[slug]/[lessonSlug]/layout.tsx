export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-secondary text-white">
      {/* Fondo neutro (educativo) + halo suave arriba (muy sutil) */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-700/12 via-indigo-700/10 to-blue-700/8 blur-[90px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-secondary/35 to-dark-secondary" />
      </div>

      {children}
    </div>
  );
}
