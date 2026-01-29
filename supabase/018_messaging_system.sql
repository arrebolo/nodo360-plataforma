-- =====================================================
-- NODO360 PLATFORM - MESSAGING SYSTEM
-- Migration: 018_messaging_system.sql
-- =====================================================
-- Sistema de mensajería entre estudiantes e instructores.
--
-- FUNCIONALIDAD:
-- - Conversaciones 1:1 entre usuarios
-- - Mensajes con límite de 5000 caracteres
-- - Tracking de mensajes leídos/no leídos
-- - RLS para privacidad de conversaciones
-- =====================================================

-- =====================================================
-- TABLE: conversations
-- =====================================================
-- Almacena las conversaciones entre dos usuarios

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicados (ordenamos los IDs para consistencia)
  CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2),
  CONSTRAINT different_participants CHECK (participant_1 != participant_2)
);

-- =====================================================
-- TABLE: messages
-- =====================================================
-- Almacena los mensajes individuales

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Índice para mensajes por conversación (ordenados por fecha)
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- Índice para buscar conversaciones por participantes
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1, participant_2);

-- Índice para mensajes no leídos
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- Índice para buscar conversaciones de un usuario específico
CREATE INDEX idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON public.conversations(participant_2);

-- Índice para ordenar por último mensaje
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC NULLS LAST);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: conversations
-- =====================================================

-- Usuarios solo pueden ver sus propias conversaciones
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() IN (participant_1, participant_2));

-- Usuarios pueden crear conversaciones donde son participantes
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IN (participant_1, participant_2));

-- Usuarios pueden actualizar sus conversaciones (para last_message_at via trigger)
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() IN (participant_1, participant_2));

-- =====================================================
-- POLICIES: messages
-- =====================================================

-- Usuarios solo pueden ver mensajes de sus conversaciones
CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- Usuarios solo pueden enviar mensajes en sus conversaciones
CREATE POLICY "Users can send messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- Usuarios pueden marcar mensajes como leídos (actualizar read_at)
CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND auth.uid() IN (c.participant_1, c.participant_2)
    )
  );

-- =====================================================
-- FUNCTION: get_or_create_conversation
-- =====================================================
-- Obtiene una conversación existente o crea una nueva

CREATE OR REPLACE FUNCTION get_or_create_conversation(p_user_1 UUID, p_user_2 UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_ordered_1 UUID;
  v_ordered_2 UUID;
BEGIN
  -- Validar que no sea el mismo usuario
  IF p_user_1 = p_user_2 THEN
    RAISE EXCEPTION 'No puedes crear una conversación contigo mismo';
  END IF;

  -- Ordenar IDs para consistencia (siempre el menor primero)
  IF p_user_1 < p_user_2 THEN
    v_ordered_1 := p_user_1;
    v_ordered_2 := p_user_2;
  ELSE
    v_ordered_1 := p_user_2;
    v_ordered_2 := p_user_1;
  END IF;

  -- Buscar conversación existente
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE (participant_1 = v_ordered_1 AND participant_2 = v_ordered_2)
     OR (participant_1 = v_ordered_2 AND participant_2 = v_ordered_1);

  -- Si no existe, crear nueva
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1, participant_2)
    VALUES (v_ordered_1, v_ordered_2)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: get_unread_count
-- =====================================================
-- Obtiene el conteo de mensajes no leídos para un usuario

CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE (c.participant_1 = p_user_id OR c.participant_2 = p_user_id)
    AND m.sender_id != p_user_id
    AND m.read_at IS NULL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: mark_messages_as_read
-- =====================================================
-- Marca todos los mensajes de una conversación como leídos

CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Solo marcar mensajes que NO fueron enviados por el usuario actual
  UPDATE public.messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: update_conversation_last_message
-- =====================================================
-- Actualiza last_message_at cuando se inserta un mensaje

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON public.messages;

CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- =====================================================
-- COMPLETADO
-- =====================================================
-- Próximos pasos:
-- 1. Aplicar esta migración en Supabase
-- 2. Crear API endpoints:
--    - GET /api/messages/conversations (listar conversaciones)
--    - GET /api/messages/[conversationId] (obtener mensajes)
--    - POST /api/messages/[conversationId] (enviar mensaje)
--    - POST /api/messages/conversations (crear/obtener conversación)
-- 3. Crear páginas:
--    - /dashboard/mensajes (lista de conversaciones)
--    - /dashboard/mensajes/[conversationId] (chat)
-- =====================================================
