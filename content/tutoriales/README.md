# Formato de un tutorial

Qué escribir y cómo está en `docs/TUTORIALES.md`. Aquí, solo el formato del archivo.

```
content/tutoriales/<slug>/tutorial.md      cabecera YAML + Markdown
content/tutoriales/<slug>/capturas.json    lo escribe el script de capturas; no se edita a mano
public/tutoriales/<slug>/NN-….webp         las capturas convertidas
```

El nombre de la carpeta es el slug y la URL: `/tutoriales/<slug>`. Minúsculas,
números y guiones; describe la tarea, sin versión ni año.

## Cabecera

```yaml
---
titulo: Comprobar el hash SHA-256 de una descarga   # 70 caracteres como máximo
resumen: …                                          # 160 como máximo; es la descripción para buscadores
categoria: verificacion       # verificacion | carteras | transacciones | nodo | privacidad
nivel: beginner               # beginner | intermediate | advanced
duracionMinutos: 10           # entre 5 y 30
sistemas: [windows, macos, linux]
red: ninguna                  # ninguna | signet | mainnet
requisitos:
  - texto: Un equipo con conexión a internet
  - tutorial: otro-slug       # otro tutorial; si este está publicado, aquel también
programas:
  - nombre: Bitcoin Core
    version: "31.1"           # siempre entre comillas
    descargaOficial: https://…
    repositorio: https://github.com/…
    probadoEl: 2026-10-20     # obligatorio para publicar
    probadoEn: Windows 10 22H2  # obligatorio para publicar
cursos:
  - curso: <slug de un curso publicado>
    leccion: <slug de una lección de ese curso>   # opcional
terminos: [hash]              # slugs del glosario
publicadoEl: 2026-10-20       # obligatorio para publicar
revisadoEl: 2026-10-20
estado: borrador              # borrador | publicado | revisar
---
```

Un **borrador** solo se ve con `npm run dev` y en las previsualizaciones de
Vercel. En producción no existe.

## Cuerpo

- `## Paso N: Verbo y objeto`, numerados desde 1. Cada paso lleva su bloque
  `:::deberias-ver`.
- `##` y `###` para el resto de secciones. Sin `#`: el título va en la cabecera.
- Comandos en bloques de código con lenguaje `powershell` o `bash`, y lo que
  sale en pantalla en un bloque `salida`, que no tiene botón de copiar.
- Capturas: `![texto alternativo que describe lo que se ve](NN-que-muestra.webp "pie opcional")`.
  Mientras no exista, en el borrador se ve un recuadro «Captura pendiente».
- Enlaces internos solo a `/glosario/…`, `/cursos/…` y `/tutoriales/…`, y
  comprobados. Externos, solo `https`, sin parámetros de referido ni de
  seguimiento y nunca a exchanges.

Bloques:

```markdown
:::deberias-ver
Lo que aparece cuando ha salido bien.
:::

:::aviso{tipo="seguridad"}          tipo: seguridad | nota | si-falla
Texto del aviso.
:::

:::aviso{tipo="si-falla" titulo="Si no coincide"}
Con título propio.
:::

:::sistema{so="windows"}            so: windows | macos | linux
Lo que cambia en ese sistema. Los bloques seguidos se agrupan.
:::
```

En el texto:

```markdown
Su :termino[hash]{slug="hash"} SHA-256          enlace al glosario
Antes, haz :tutorial[el anterior]{slug="otro"}  enlace a otro tutorial
```

No se admite nada más: ni HTML, ni tablas, ni citas. Si un `:` pegado a una
palabra da el error «marca desconocida», escribe un espacio después de los dos
puntos.

## Comprobar y publicar

```bash
npx tsx scripts/validar-tutoriales.mts                    # lo mismo que el build
npx tsx scripts/validar-tutoriales.mts --como-publicado   # antes de quitar «borrador»
npm run preparar:capturas -- <slug>                       # PNG de C:\Capturas-tutoriales\<slug> a WebP
```
