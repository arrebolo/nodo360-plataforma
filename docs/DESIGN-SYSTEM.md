# Sistema de Diseno Nodo360 - Web3 / DAO

## Variables CSS

| Variable | Valor | Uso |
|----------|-------|-----|
| `--n360-bg` | #050712 | Fondo principal |
| `--n360-bg-elevated` | #0b0f1f | Fondo elevado |
| `--n360-surface` | #111827 | Superficie |
| `--n360-primary` | #f7931a | Bitcoin Orange |
| `--n360-accent-blue` | #00d4ff | Acento Web3 |
| `--n360-accent-green` | #22c55e | Exito/Activo |
| `--n360-text` | #e5e7eb | Texto principal |
| `--n360-text-soft` | #9ca3af | Texto secundario |
| `--n360-border-subtle` | rgba(148,163,184,0.2) | Bordes sutiles |

## Clases de Layout

| Clase | Uso |
|-------|-----|
| `.n360-page` | Envolver pagina completa con gradientes |
| `.n360-container` | Contenedor centrado max-width 1120px |
| `.n360-section` | Bloques principales con glassmorphism |
| `.n360-section--stacked` | Seccion con flex column gap |

## Cards

| Clase | Uso |
|-------|-----|
| `.n360-card` | Card principal con gradiente |
| `.n360-card-ghost` | Card ligera/secundaria |
| `.n360-card--clickable` | Anadir hover effects |

## Badges y Pills

| Clase | Uso |
|-------|-----|
| `.n360-badge` | Badge base |
| `.n360-badge--primary` | Estado naranja/principal |
| `.n360-badge--success` | Estado verde/completado |
| `.n360-badge--info` | Estado azul/info |
| `.n360-badge--instructor` | Badge azul instructor |
| `.n360-badge--mentor` | Badge dorado mentor |
| `.n360-pill` | Pill clickable (filtros) |
| `.n360-pill--active` | Pill activo |

## Botones

| Clase | Uso |
|-------|-----|
| `.n360-btn` | Boton base |
| `.n360-btn--primary` | Boton principal naranja |
| `.n360-btn--ghost` | Boton transparente |

## Inputs

| Clase | Uso |
|-------|-----|
| `.n360-input` | Input de texto |
| `.n360-select` | Select/dropdown |

## Texto

| Clase | Uso |
|-------|-----|
| `.n360-label-muted` | Texto pequeno gris |
| `.n360-mono` | Texto monospace uppercase |

## Animaciones

| Clase | Uso |
|-------|-----|
| `.animate-fade-in` | Entrada con fade |
| `.animate-slide-in` | Entrada desde izquierda |
| `.animate-scale-in` | Entrada con escala |
| `.animate-bounce-slow` | Rebote suave |
| `.animate-gradient` | Gradiente animado |
| `.animate-pulse-soft` | Pulso suave |
| `.animate-glow` | Efecto glow |

## Ejemplo de Uso

```tsx
<main className="n360-page">
  <div className="n360-container">
    <section className="n360-section n360-section--stacked">
      <h1>Titulo</h1>
      <span className="n360-badge n360-badge--success">Completado</span>
      <button className="n360-btn n360-btn--primary">Accion</button>
    </section>

    <div className="n360-card n360-card--clickable">
      Card clickable
    </div>

    <div className="n360-card-ghost">
      Card secundaria
    </div>

    <input className="n360-input" placeholder="Buscar..." />
  </div>
</main>
```

## Colores para Mentoria

```css
/* Instructor */
bg-blue-500/20 text-blue-400 border-blue-500/30

/* Mentor */
bg-amber-500/20 text-amber-400 border-amber-500/30

/* Disponible */
bg-emerald-500/10 text-emerald-400

/* Pendiente */
bg-yellow-500/20 text-yellow-400
```
