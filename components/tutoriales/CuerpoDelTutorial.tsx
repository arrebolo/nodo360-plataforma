import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react'
import type { Nodes, RootContent } from 'mdast'
import { arbolDelCuerpo, LENGUAJES_DE_CODIGO, textoDe } from '@/lib/tutoriales/analizar'
import { SISTEMAS, type Tutorial } from '@/lib/tutoriales/tipos'
import { BotonCopiar } from './BotonCopiar'

/**
 * El cuerpo de un tutorial, de Markdown a React.
 *
 * No hay dangerouslySetInnerHTML ni HTML crudo: cada nodo admitido tiene aquí
 * su elemento, y lo que no está en la lista ya lo ha rechazado
 * lib/tutoriales/analizar.ts antes de llegar a construir la página.
 */

const AVISOS = {
  seguridad: { Icono: ShieldAlert, titulo: 'Seguridad', clase: 'border-red-500/40 bg-red-500/10', icono: 'text-red-400' },
  nota: { Icono: Info, titulo: 'Nota', clase: 'border-white/15 bg-white/5', icono: 'text-white/60' },
  'si-falla': { Icono: AlertTriangle, titulo: 'Si falla', clase: 'border-amber-500/40 bg-amber-500/10', icono: 'text-amber-400' },
} as const

/** Ancla de un encabezado: `paso-3` para los pasos, el texto en minúsculas para el resto. */
export function anclaDe(texto: string): string {
  const paso = /^Paso (\d+):/.exec(texto)
  if (paso) return `paso-${paso[1]}`
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CuerpoDelTutorial({ tutorial }: { tutorial: Tutorial }) {
  const arbol = arbolDelCuerpo(tutorial.cuerpo)
  return <>{bloques(arbol.children, tutorial)}</>
}

/** Los bloques de un nivel, juntando en un recuadro los :::sistema seguidos. */
function bloques(nodos: RootContent[], t: Tutorial): React.ReactNode[] {
  const salida: React.ReactNode[] = []
  for (let i = 0; i < nodos.length; i++) {
    const n = nodos[i]
    if (n.type === 'containerDirective' && n.name === 'sistema') {
      const grupo = [n]
      while (nodos[i + 1]?.type === 'containerDirective' && (nodos[i + 1] as typeof n).name === 'sistema') {
        grupo.push(nodos[++i] as typeof n)
      }
      salida.push(
        <div key={i} className="my-6 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03]">
          {grupo.map((g, j) => {
            const so = String(g.attributes?.so) as keyof typeof SISTEMAS
            return (
              <section key={j} className="p-4 sm:p-5" aria-label={`En ${SISTEMAS[so]}`}>
                <p className="mb-2 text-sm font-semibold text-white/80">En {SISTEMAS[so]}</p>
                {bloques(g.children as RootContent[], t)}
              </section>
            )
          })}
        </div>
      )
      continue
    }
    salida.push(<React.Fragment key={i}>{nodo(n, t)}</React.Fragment>)
  }
  return salida
}

function hijos(n: Nodes, t: Tutorial): React.ReactNode {
  if (!('children' in n)) return null
  return (n.children as Nodes[]).map((h, i) => <React.Fragment key={i}>{nodo(h, t)}</React.Fragment>)
}

function nodo(n: Nodes, t: Tutorial): React.ReactNode {
  switch (n.type) {
    case 'root':
      return hijos(n, t)
    case 'paragraph':
      return <p className="my-4 leading-relaxed text-white/80">{hijos(n, t)}</p>
    case 'heading': {
      const id = anclaDe(textoDe(n))
      if (n.depth === 2) {
        return (
          <h2 id={id} className="mt-12 mb-4 scroll-mt-24 text-2xl font-bold text-white">
            {hijos(n, t)}
          </h2>
        )
      }
      return (
        <h3 id={id} className="mt-8 mb-3 scroll-mt-24 text-lg font-semibold text-white">
          {hijos(n, t)}
        </h3>
      )
    }
    case 'text':
      return n.value
    case 'emphasis':
      return <em>{hijos(n, t)}</em>
    case 'strong':
      return <strong className="font-semibold text-white">{hijos(n, t)}</strong>
    case 'break':
      return <br />
    case 'inlineCode':
      return <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-white">{n.value}</code>
    case 'code': {
      const lenguaje = n.lang as keyof typeof LENGUAJES_DE_CODIGO
      const esSalida = lenguaje === 'salida'
      return (
        <div className={`my-4 overflow-hidden rounded-xl border ${esSalida ? 'border-white/5 bg-black/20' : 'border-white/10 bg-black/40'}`}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
            <span className="text-xs text-white/50">{LENGUAJES_DE_CODIGO[lenguaje]}</span>
            {!esSalida && <BotonCopiar texto={n.value} />}
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed [color-scheme:dark]">
            <code className={`font-mono ${esSalida ? 'text-white/60' : 'text-white'}`}>{n.value}</code>
          </pre>
        </div>
      )
    }
    case 'list': {
      const clase = 'my-4 space-y-2 pl-6 text-white/80 marker:text-white/40'
      return n.ordered ? (
        <ol className={`${clase} list-decimal`} start={n.start ?? undefined}>{hijos(n, t)}</ol>
      ) : (
        <ul className={`${clase} list-disc`}>{hijos(n, t)}</ul>
      )
    }
    case 'listItem':
      // Los párrafos de una lista compacta no llevan margen propio.
      return (
        <li className="pl-1 [&>p]:my-0">
          {hijos(n, t)}
        </li>
      )
    case 'link':
      if (n.url.startsWith('/')) {
        return (
          <Link href={n.url} className="text-brand-light underline underline-offset-2 hover:text-white">
            {hijos(n, t)}
          </Link>
        )
      }
      return (
        <a href={n.url} rel="noopener noreferrer" className="text-brand-light underline underline-offset-2 hover:text-white">
          {hijos(n, t)}
        </a>
      )
    case 'image':
      return <CapturaDelPaso nombre={n.url} alt={n.alt ?? ''} pie={n.title ?? undefined} tutorial={t} />
    case 'textDirective': {
      const slug = String(n.attributes?.slug ?? '')
      const href = n.name === 'termino' ? `/glosario/${slug}` : `/tutoriales/${slug}`
      return (
        <Link href={href} className="text-brand-light underline decoration-dotted underline-offset-2 hover:text-white">
          {hijos(n, t)}
        </Link>
      )
    }
    case 'containerDirective': {
      if (n.name === 'deberias-ver') {
        return (
          <aside className="my-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Deberías ver
            </p>
            <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{bloques(n.children as RootContent[], t)}</div>
          </aside>
        )
      }
      if (n.name === 'aviso') {
        const tipo = String(n.attributes?.tipo) as keyof typeof AVISOS
        const a = AVISOS[tipo]
        return (
          <aside role="note" className={`my-6 rounded-xl border p-4 sm:p-5 ${a.clase}`}>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
              <a.Icono className={`h-4 w-4 ${a.icono}`} aria-hidden="true" />
              {n.attributes?.titulo || a.titulo}
            </p>
            <div className="[&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{bloques(n.children as RootContent[], t)}</div>
          </aside>
        )
      }
      return bloques(n.children as RootContent[], t)
    }
    default:
      // analizar.ts ya ha rechazado cualquier otro nodo.
      return null
  }
}

function CapturaDelPaso({ nombre, alt, pie, tutorial }: { nombre: string; alt: string; pie?: string; tutorial: Tutorial }) {
  const captura = tutorial.capturas[nombre]
  if (!captura) {
    // Solo puede pasar en un borrador: en un publicado es un error de build.
    return (
      <figure className="my-6 rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-5 text-sm">
        <p className="font-semibold text-amber-300">Captura pendiente: {nombre.replace(/\.webp$/, '.png')}</p>
        <p className="mt-1 text-white/70">{alt}</p>
        {pie && <figcaption className="mt-1 text-white/50 italic">{pie}</figcaption>}
      </figure>
    )
  }
  return (
    <figure className="my-6">
      <Image
        src={`/tutoriales/${tutorial.slug}/${nombre}`}
        alt={alt}
        width={captura.ancho}
        height={captura.alto}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-xl border border-white/10"
      />
      {pie && <figcaption className="mt-2 text-center text-sm text-white/60">{pie}</figcaption>}
    </figure>
  )
}
