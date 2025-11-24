# 🎮 Sistema de Gamificación - Quick Start

**Tiempo:** 5 minutos
**Dificultad:** Fácil (copiar/pegar SQL)

---

## ⚡ 3 PASOS PARA ACTIVAR GAMIFICACIÓN

### 1️⃣ APLICAR SQL (3 minutos)

**Ir a Supabase Dashboard:**
```
https://supabase.com/dashboard
```

**SQL Editor → New Query:**

1. Abrir archivo: `supabase/migrations/004_gamification_system.sql`
2. Copiar TODO (Ctrl+A, Ctrl+C)
3. Pegar en SQL Editor (Ctrl+V)
4. Click "Run" ▶
5. Esperar "Success" ✅

---

### 2️⃣ VERIFICAR (1 minuto)

**En SQL Editor, ejecutar:**

```sql
-- Ver badges disponibles:
SELECT slug, title, rarity, xp_reward
FROM badges
WHERE is_active = true
ORDER BY order_index;
```

**Debe mostrar 15+ badges** (Primera Lección, Aprendiz, etc.)

---

### 3️⃣ PROBAR (1 minuto)

1. **Login** en la app
2. **Ir a** `/dashboard`
3. **Verificar** sección "🎮 Tu Progreso y Logros"
4. **Ver** card morada con tu nivel

---

## ✅ ¿FUNCIONÓ?

**Debes ver:**

- ✅ Card "Nivel 1" con barra de progreso XP
- ✅ Sección "Badges Recientes" (puede estar vacía)
- ✅ Podio "Top 3 de la Semana"
- ✅ Links a `/dashboard/badges` y `/dashboard/leaderboard`

---

## 🎯 GANAR PRIMER XP

**Para probar que todo funciona:**

1. **Ir a cualquier curso inscrito**
2. **Completar una lección**
3. **Volver al dashboard**
4. **Verificar:**
   - Nivel ahora muestra "10 XP"
   - Badge "Primera Lección 🎯" desbloqueado

---

## 🏆 CÓMO FUNCIONA

```
Completas lección
    ↓
+10 XP automáticamente
    ↓
Badge "Primera Lección" desbloqueado
    ↓
+5 XP extra del badge
    ↓
Total: 15 XP ganados
```

---

## 📊 VERIFICAR EN BASE DE DATOS

```sql
-- Ver tus stats:
SELECT total_xp, current_level, total_badges
FROM user_gamification_stats
WHERE user_id = auth.uid();

-- Ver eventos de XP:
SELECT event_type, xp_earned, description, created_at
FROM xp_events
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Ver tus badges:
SELECT
  b.title,
  b.icon,
  b.rarity,
  ub.unlocked_at
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id = auth.uid()
ORDER BY ub.unlocked_at DESC;
```

---

## 🔥 SUBIR DE NIVEL RÁPIDO

**XP por actividad:**
- ✅ Lección completada: +10 XP
- 🏅 Badge desbloqueado: +5 a +500 XP
- 📚 Curso completado: +50 a +300 XP
- 🔥 Racha diaria: +25 a +200 XP

**Niveles:**
- Nivel 1: 0 XP
- Nivel 2: 100 XP
- Nivel 3: 250 XP
- Nivel 4: 450 XP
- Nivel 5: 700 XP
- Nivel 10: 1,400 XP
- Nivel 20: 4,400 XP

---

## 🏅 BADGES FÁCILES DE CONSEGUIR

1. **Primera Lección** 🎯
   - Completar 1 lección
   - +5 XP

2. **Primer Curso** 🏆
   - Completar 1 curso
   - +50 XP

3. **Aprendiz** 📚
   - Completar 10 lecciones
   - +25 XP

4. **Racha 7 días** 🔥
   - 7 días seguidos aprendiendo
   - +75 XP

---

## 🎨 PÁGINAS DISPONIBLES

### Dashboard Principal
```
/dashboard
```
- Vista general con nivel y badges recientes
- Podio top 3
- Link a páginas dedicadas

### Todos los Badges
```
/dashboard/badges
```
- Grid completo de badges desbloqueados
- Detalles de cada badge
- Tips para desbloquear más

### Leaderboard Completo
```
/dashboard/leaderboard
```
- Top 100 usuarios
- Tu posición actual
- Stats completas

---

## 💡 TIPS

### Para Testing:

```sql
-- Simular completar varias lecciones:
UPDATE user_progress
SET is_completed = true
WHERE user_id = auth.uid()
  AND is_completed = false
LIMIT 5;

-- Otorgar XP manual (solo testing):
INSERT INTO xp_events (user_id, event_type, xp_earned, description)
VALUES (auth.uid(), 'manual_test', 100, 'Testing XP');

-- Ver qué badges puedes desbloquear:
SELECT
  b.title,
  b.requirement_type,
  b.requirement_value,
  b.xp_reward
FROM badges b
WHERE b.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub
    WHERE ub.user_id = auth.uid()
      AND ub.badge_id = b.id
  )
ORDER BY b.requirement_value;
```

---

## ❌ TROUBLESHOOTING

### No veo la sección de gamificación en dashboard

**Causa:** Migration no aplicada
**Solución:** Aplicar `004_gamification_system.sql` en Supabase

### XP no aumenta al completar lección

**Diagnóstico:**
```sql
-- Verificar trigger existe:
SELECT * FROM pg_trigger WHERE tgname = 'trigger_award_xp_lesson';
```

**Solución:** Re-aplicar migration

### Badge no se desbloquea

**Diagnóstico:**
```sql
-- Ejecutar verificación manual:
SELECT check_and_award_badges(auth.uid());
```

**Solución:** Verificar requisitos del badge

### Leaderboard vacío

**Causa:** No hay usuarios con stats
**Solución:** Trigger se aplica a nuevos usuarios. Para usuarios existentes:

```sql
-- Crear stats para usuario actual:
INSERT INTO user_gamification_stats (user_id)
VALUES (auth.uid())
ON CONFLICT (user_id) DO NOTHING;
```

---

## 📞 AYUDA RÁPIDA

| Problema | Solución |
|----------|----------|
| No veo XP | Aplicar migration SQL |
| Badges no aparecen | Verificar tabla `badges` tiene 15+ rows |
| Nivel no sube | Completar más lecciones (100 XP = Nivel 2) |
| Leaderboard error 500 | Verificar políticas RLS en Supabase |
| No se crean stats | Trigger solo aplica a usuarios nuevos |

---

## 🎯 RESULTADO ESPERADO

Después de aplicar la migration y completar 1 lección:

```
Dashboard muestra:
├── 🎮 Tu Progreso y Logros
│   ├── Card "Nivel 1 → Nivel 2" (progreso 15%)
│   │   └── 15 / 100 XP
│   ├── Badges Recientes
│   │   └── 🎯 Primera Lección (Common)
│   └── Top 3 de la Semana
│       └── (Podio vacío si eres el único usuario)
│
├── Mis Cursos
│   └── (tus cursos con progreso actualizado)
│
└── Links:
    ├── /dashboard/badges → Ver todos tus badges
    └── /dashboard/leaderboard → Ver ranking completo
```

---

## ✅ CHECKLIST

- [ ] SQL aplicado en Supabase
- [ ] Tabla `badges` tiene 15+ badges
- [ ] Tabla `user_gamification_stats` creada
- [ ] Dashboard muestra sección "🎮 Tu Progreso y Logros"
- [ ] Completé 1 lección
- [ ] XP aumentó a 15 (10 de lección + 5 de badge)
- [ ] Badge "Primera Lección" desbloqueado
- [ ] Puedo acceder a `/dashboard/badges`
- [ ] Puedo acceder a `/dashboard/leaderboard`

---

**Estado:** Sistema listo para uso
**Próximo paso:** Completar más lecciones y ver badges desbloqueándose automáticamente

**Documentación completa:** `FASE-3B-GAMIFICACION.md`
