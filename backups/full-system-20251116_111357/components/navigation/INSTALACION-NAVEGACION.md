# Sistema de Navegación Nodo360 - Guía de Instalación

## 📁 Estructura de Archivos

```
nodo360-plataforma/
├── app/
│   ├── layout.jsx                    # Layout raíz con Header/Footer
│   ├── globals.css                   # Estilos globales
│   └── page.jsx                      # Página de inicio
│
├── components/
│   └── navigation/
│       ├── Header.jsx                # Header principal
│       └── Footer.jsx                # Footer
│
├── tailwind.config.js                # Configuración Tailwind
└── package.json
```

---

## 🚀 Instalación

### 1. Copiar los archivos a tu proyecto

Copia los archivos en estas ubicaciones exactas:

```bash
# Desde donde descargaste los archivos:
cp Header.jsx nodo360-plataforma/components/navigation/
cp Footer.jsx nodo360-plataforma/components/navigation/
cp layout.jsx nodo360-plataforma/app/
cp globals.css nodo360-plataforma/app/
cp tailwind.config.js nodo360-plataforma/
```

### 2. Crear carpeta de componentes si no existe

```bash
cd /c/Users/alber/nodo360-projects/nodo360-plataforma
mkdir -p components/navigation
```

### 3. Verificar dependencias

Asegúrate de tener estas dependencias en tu `package.json`:

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

### 4. Instalar dependencias (si hace falta)

```bash
npm install
```

### 5. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 para ver el resultado.

---

## 🎨 Componentes Incluidos

### Header.jsx
**Características:**
- ✅ Sticky scroll (se queda fijo al hacer scroll)
- ✅ Responsive con menú hamburger en móvil
- ✅ Navegación activa resaltada
- ✅ Botones CTA (Login + Registro)
- ✅ Animaciones suaves
- ✅ Colores consistentes con diseño Elementor

**Props:** Ninguno (autocontenido)

**Uso:**
```jsx
import Header from '@/components/navigation/Header'

<Header />
```

---

### Footer.jsx
**Características:**
- ✅ 5 columnas de enlaces
- ✅ Redes sociales (Twitter, YouTube, GitHub)
- ✅ Enlaces externos con target="_blank"
- ✅ Copyright dinámico (año actual)
- ✅ Responsive (1 columna en móvil, 5 en desktop)

**Props:** Ninguno (autocontenido)

**Uso:**
```jsx
import Footer from '@/components/navigation/Footer'

<Footer />
```

---

## 🎯 Paleta de Colores

Los colores están configurados para coincidir exactamente con tu diseño Elementor:

```css
--color-bg-primary: #000000      /* Fondo principal */
--color-bg-secondary: #0d1117    /* Fondo secundario */
--color-border: #30363d          /* Bordes */
--color-accent: #dc2626          /* Rojo Bitcoin */
--color-accent-hover: #b91c1c    /* Rojo hover */
```

También disponibles como clases de Tailwind:
- `bg-nodo-black`
- `bg-nodo-dark`
- `bg-nodo-red`
- `border-nodo-border`
- `text-nodo-red`

---

## 📝 Personalización

### Modificar enlaces del Header

Edita el array `navLinks` en `Header.jsx`:

```jsx
const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/cursos', label: 'Cursos' },
  { href: '/comunidad', label: 'Comunidad' },
  { href: '/proyectos', label: 'Proyectos' },
  // Añade más aquí
]
```

### Modificar enlaces del Footer

Edita el objeto `footerLinks` en `Footer.jsx`:

```jsx
const footerLinks = {
  cursos: [
    { label: 'Tu curso', href: '/tu-curso' },
    // Añade más aquí
  ],
  // ...
}
```

### Cambiar redes sociales

Edita el array `socialLinks` en `Footer.jsx`:

```jsx
const socialLinks = [
  { name: 'Twitter', href: 'https://...', icon: <svg>...</svg> },
  // Añade más aquí
]
```

---

## 🎨 Clases Utility Personalizadas

### Botones

```jsx
// Botón primario
<button className="btn btn-primary">
  Empezar Gratis
</button>

// Botón outline
<button className="btn btn-outline">
  Más Info
</button>

// Botón grande
<button className="btn btn-primary btn-large">
  Ver Cursos
</button>
```

### Cards

```jsx
// Card básica
<div className="card">
  Contenido
</div>

// Card interactiva (con hover)
<div className="card card-interactive">
  Contenido
</div>
```

### Secciones

```jsx
// Sección normal
<section className="section">
  <h2 className="section-title">Título</h2>
  <p className="section-subtitle">Subtítulo</p>
</section>

// Sección oscura
<section className="section section-dark">
  Contenido
</section>
```

---

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Móvil grande */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeño */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop grande */
```

**Comportamiento del Header:**
- Desktop (≥768px): Menú horizontal completo
- Móvil (<768px): Menú hamburger que se despliega

---

## ✅ Checklist de Verificación

- [ ] Archivos copiados en las ubicaciones correctas
- [ ] Carpeta `components/navigation/` creada
- [ ] `npm install` ejecutado
- [ ] `npm run dev` funciona sin errores
- [ ] Header se ve correctamente en el navegador
- [ ] Footer se ve correctamente
- [ ] Menú hamburger funciona en móvil
- [ ] Enlaces de navegación funcionan
- [ ] Colores coinciden con el diseño original

---

## 🚧 Próximos Pasos

Una vez que Header y Footer estén funcionando, podemos continuar con:

1. **Breadcrumbs** - Para navegación contextual en cursos
2. **Sidebar** - Para navegación entre módulos/lecciones
3. **SearchBar** - Buscador global
4. **Páginas de cursos** - Layout específico para contenido educativo

---

## 🆘 Solución de Problemas

### Error: "Module not found: Can't resolve '@/components/navigation/Header'"

Asegúrate de que tu `tsconfig.json` o `jsconfig.json` tenga:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Los estilos no se aplican

1. Verifica que `globals.css` esté importado en `layout.jsx`
2. Ejecuta `npm run dev` de nuevo
3. Limpia caché: `rm -rf .next`

### El menú móvil no funciona

El componente Header usa `'use client'`, asegúrate de que esté en la primera línea del archivo.

---

## 📚 Documentación Adicional

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Guía de Accesibilidad](https://www.w3.org/WAI/WCAG21/quickref/)

---

**¿Necesitas ayuda?** Consulta la documentación o pide asistencia en el desarrollo.
