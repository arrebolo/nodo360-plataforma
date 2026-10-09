# Entorno para las capturas de los tutoriales

Para que en las capturas no salga nada personal (ver la sección 8 de
`docs/TUTORIALES.md`), se hacen en un Windows que no se usa para nada más.

Medido en el equipo de trabajo el 09/10/2026: **Windows 10 Pro 22H2**, AMD Ryzen 5
2600, placa ASUS TUF GAMING B550-PLUS, pantalla de 1920×1080.

---

## Qué opción usar

| | **Cuenta local aparte** (recomendada) | Windows Sandbox |
|---|---|---|
| ¿La admite este Windows? | Sí | Sí: está en **Pro**, Enterprise y Education, no en Home |
| ¿Funciona hoy? | Sí | **No**: la virtualización está **desactivada en la UEFI** (`VirtualizationFirmwareEnabled = False`). Hay que activarla primero |
| Qué queda entre sesiones | Todo, hasta que se borre | Nada: se cierra y desaparece |
| Ruta del usuario en las capturas | `C:\Users\usuario\…` | `C:\Users\WDAGUtilityAccount\…`, un nombre que despista a quien lee |
| Para los tutoriales que sincronizan un nodo de signet | Sirve: la sincronización se hace una vez | Hay que repetirla cada vez |
| Lo que hay que vigilar | Que no se cuele nada de la cuenta principal (ventana de administrador, OneDrive) | Poco: arranca siempre limpio |

**Recomendación: la cuenta local aparte.** Funciona sin tocar la UEFI, la ruta
que sale en las capturas se entiende, y aguanta los tutoriales largos de la
serie. Windows Sandbox queda como opción para más adelante (al final de este
documento).

---

## A. Preparar la cuenta local (una sola vez, unos 20 minutos)

### 1. Crear la cuenta

Desde tu cuenta de siempre:

1. **Inicio → Configuración → Cuentas → Familia y otros usuarios** (en algunos
   equipos se llama **«Otros usuarios»**).
2. **«Agregar otra persona a este equipo»**.
3. **«No tengo la información de inicio de sesión de esta persona»**.
4. **«Agregar un usuario sin cuenta Microsoft»**.
5. Nombre de usuario: **`usuario`**. Es el que saldrá en las rutas de las
   capturas (`C:\Users\usuario\Downloads`), y es neutro a propósito.
6. Una contraseña, y las tres preguntas de seguridad con respuestas inventadas.
   Guárdalo todo en tu gestor de contraseñas.
7. Déjala como **usuario estándar**: no la hagas administradora.

### 2. Primer inicio de sesión

1. Cierra la sesión y entra con `usuario`.
2. En las pantallas de privacidad del primer inicio, **desactívalo todo**:
   ubicación, diagnóstico, anuncios personalizados, reconocimiento de voz.
3. Si aparece **OneDrive** pidiendo iniciar sesión, ciérralo. Luego, en el icono
   de OneDrive de la barra de tareas → **Ayuda y configuración → Configuración**
   → desmarca **«Iniciar OneDrive automáticamente al iniciar sesión en
   Windows»**.

### 3. Escritorio y barra de tareas

Todo desde **Configuración**, con la sesión de `usuario`:

1. **Personalización → Fondo**: **Color sólido**, el que viene por defecto.
2. **Personalización → Colores**: **Claro**. Así todas las capturas tienen el
   mismo aspecto.
3. **Personalización → Barra de tareas**: desactiva **«Mostrar el botón Vista
   de tareas»** y, con clic derecho en la barra, quita **«Noticias e
   intereses»** (muestra tu ciudad y el tiempo) y deja la búsqueda como
   **«Oculto»**.
4. **Sistema → Notificaciones y acciones**: desactiva **«Obtener notificaciones
   de aplicaciones y otros remitentes»**.
5. **Sistema → Pantalla**: **Escala 100 %**, resolución **1920 × 1080**.
6. Clic derecho en el escritorio → **Ver** → desmarca **«Mostrar iconos del
   escritorio»**.

### 4. Navegador

Se usa **Microsoft Edge**, que ya viene instalado, **sin iniciar sesión**.

1. Al abrirlo por primera vez, elige **«Continuar sin iniciar sesión»** (o
   cierra la ventana de bienvenida) y **no importes nada** de otro navegador.
2. Página de nueva pestaña: el engranaje → **Diseño de página → Personalizado**
   → **Contenido: Desactivado** y sin **«Vínculos rápidos»**. Así no salen
   noticias ni el tiempo.
3. **Configuración → Privacidad, búsqueda y servicios**: **Estricta** en la
   prevención de seguimiento.
4. No guardes contraseñas ni marcadores en este perfil.

### 5. PowerShell legible

1. Inicio → escribe **PowerShell** → abre **Windows PowerShell** (no el ISE).
2. Clic derecho en la barra de título → **Propiedades**:
   - **Fuente**: Consolas, tamaño **20**.
   - **Diseño → Tamaño de la ventana**: ancho **100**, alto **25**.
3. **Aceptar**. Se queda guardado para las próximas veces.

### 6. Carpeta para pasar las capturas

1. Con la sesión de `usuario`, crea la carpeta **`C:\Capturas-tutoriales`**.
2. Desde tu cuenta de siempre, comprueba que la puedes abrir. Las carpetas de la
   raíz de `C:` heredan permiso de modificación para todas las cuentas del equipo,
   así que debería abrirse sin más. Si no se abre, en un PowerShell de
   administrador de tu cuenta:

   ```powershell
   icacls "C:\Capturas-tutoriales" /grant "usuario:(OI)(CI)M"
   ```

Es la única carpeta que comparten las dos cuentas. La cuenta `usuario` no puede
leer tu carpeta personal, ni tú necesitas entrar en la suya.

---

## B. Antes de cada sesión de capturas (2 minutos)

1. Entra con `usuario`. **Cierra todo lo que no vayas a capturar.**
2. En Edge: **Ctrl+Mayús+Supr** → borrar el historial y las descargas de
   **«Todo el tiempo»**. Deja una sola pestaña.
3. **Vacía la carpeta Descargas** si el tutorial descarga algo, para que en la
   captura de la carpeta solo aparezca lo del tutorial.
4. Si el tutorial instala un programa: **la instalación pide permiso de
   administrador, y esa ventana muestra el nombre de tu cuenta principal. No la
   captures.** Escribe la contraseña y sigue.

## C. Cómo hacer cada captura

1. Abre **Recortes y anotación** (Inicio → escribe «Recortes»).
2. Flecha junto a **«Nuevo»** → **«Recortar en 3 segundos»**.
3. En la barra que aparece arriba, elige **«Recorte de ventana»** y haz clic en
   la ventana que quieres capturar.
4. Si hay que señalar algo, usa el **bolígrafo rojo** (un recuadro o una flecha,
   sin texto).
5. **Guardar como** → PNG → en `C:\Capturas-tutoriales\<slug-del-tutorial>\`,
   con el nombre exacto que pide la lista de capturas del tutorial
   (`03-hash-calculado.png`).
6. Ábrela a tamaño real y repásala con la regla de datos personales de
   `docs/TUTORIALES.md`.

Se capturan en **PNG**. El paso a WebP, el tamaño y quitar los metadatos los hace
un script del repositorio al añadirlas al tutorial.

---

## D. Opción para más adelante: Windows Sandbox

Abre un Windows limpio y desechable cada vez. Para usarlo en este equipo:

1. **Activar la virtualización en la UEFI** (placa ASUS B550 con procesador AMD):
   reinicia, pulsa **Supr** (o **F2**) al arrancar, **F7** para el modo avanzado,
   **Advanced → CPU Configuration → SVM Mode → Enabled**, y **F10** para guardar.
2. En Windows: **Inicio → «Activar o desactivar las características de Windows»
   → Espacio aislado de Windows** → Aceptar, y reiniciar.

Antes de hacerlo, ten en cuenta que activar la virtualización puede afectar a
otros programas de virtualización que tengas instalados. Para los tutoriales de
hoy no hace falta.
