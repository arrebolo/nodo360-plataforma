-- Tabla de solicitudes de mentoría
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  goal TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, contacted, scheduled, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscriptores del newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_mentorship_email ON mentorship_requests(email);
CREATE INDEX IF NOT EXISTS idx_mentorship_status ON mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

-- Comentarios
COMMENT ON TABLE mentorship_requests IS 'Solicitudes de mentoría 1-on-1';
COMMENT ON TABLE newsletter_subscribers IS 'Suscriptores del newsletter';
