'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { common, createLowlight } from 'lowlight'
import { useCallback, useEffect, useState } from 'react'
import { DialogoDeUnDato } from '@/components/ui/DialogoDeUnDato'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido de la leccion...',
  editable = true,
  className = ''
}: RichTextEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [2, 3, 4]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-light underline hover:text-brand transition'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4'
        }
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-xl overflow-hidden my-4'
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-[#1e1e1e] rounded-xl p-4 my-4 overflow-x-auto text-sm'
        }
      }),
      // TABLAS.
      //
      // Faltaban, y se echaban de menos escribiendo: una comparativa de carteras o de
      // comisiones en viñetas no se lee. Sin la extension no vale pegar el HTML de una
      // tabla: el esquema del editor no conoce esos nodos y los tira al pegar.
      //
      // `resizable: false` a proposito: el ancho de columna que se arrastra con el raton
      // se guarda en el HTML en pixeles, y lo que aqui se escribe se lee despues en un
      // movil. Que lo reparta el navegador.
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'w-full my-4 border-collapse overflow-hidden rounded-xl'
        }
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-white/15 bg-white/10 px-3 py-2 text-left font-semibold'
        }
      }),
      TableCell.configure({
        HTMLAttributes: { class: 'border border-white/15 px-3 py-2 align-top' }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3'
      }
    }
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  /**
   * QUE SE ESTA PIDIENDO, si se esta pidiendo algo.
   *
   * Los tres botones de medios pedian la URL con `window.prompt()`, que bloquea la
   * pestaña entera y en algunos navegadores esta desactivado o se descarta solo: en la
   * auditoria, «el boton de enlace bloquea el navegador». Ahora es un dialogo de la
   * pagina, y ademas puede explicar que URL se espera.
   */
  const [pidiendo, setPidiendo] = useState<null | 'enlace' | 'imagen' | 'youtube'>(null)

  const urlDelEnlace = editor?.getAttributes('link').href ?? ''

  const ponerElDato = useCallback(
    (valor: string) => {
      if (!editor) return
      const que = pidiendo
      setPidiendo(null)
      if (que === 'enlace') {
        // Vacio quita el enlace: es la unica forma de desenlazar sin borrar el texto.
        if (valor === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
          editor.chain().focus().extendMarkRange('link').setLink({ href: valor }).run()
        }
        return
      }
      if (!valor) return
      if (que === 'imagen') editor.chain().focus().setImage({ src: valor }).run()
      if (que === 'youtube') editor.chain().focus().setYoutubeVideo({ src: valor }).run()
    },
    [editor, pidiendo]
  )

  const insertarTabla = useCallback(() => {
    if (!editor) return
    // Tres columnas con cabecera y dos filas de datos: lo mas comun es comparar tres
    // cosas, y quitar una columna cuesta menos que inventarse la estructura.
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-xl ${className}`}>
        <div className="h-[300px] flex items-center justify-center">
          <span className="text-white/40">Cargando editor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Título H2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Título H3"
            >
              H3
            </ToolbarButton>
          </div>

          {/* Formato de texto */}
          <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Negrita (Ctrl+B)"
            >
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Cursiva (Ctrl+I)"
            >
              <ItalicIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Tachado"
            >
              <StrikeIcon />
            </ToolbarButton>
          </div>

          {/* Listas */}
          <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Lista con vinetas"
            >
              <BulletListIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Lista numerada"
            >
              <OrderedListIcon />
            </ToolbarButton>
          </div>

          {/* Bloques */}
          <div className="flex items-center gap-0.5 px-2 border-r border-white/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Cita"
            >
              <QuoteIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Bloque de código"
            >
              <CodeIcon />
            </ToolbarButton>
          </div>

          {/* Medios */}
          <div className="flex items-center gap-0.5 px-2">
            <ToolbarButton
              onClick={() => setPidiendo('enlace')}
              active={editor.isActive('link')}
              title="Insertar enlace"
            >
              <LinkIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setPidiendo('imagen')}
              title="Insertar imagen"
            >
              <ImageIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setPidiendo('youtube')}
              title="Insertar vídeo de YouTube"
            >
              <YoutubeIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={insertarTabla}
              active={editor.isActive('table')}
              title="Insertar tabla (3 columnas con cabecera)"
            >
              <TableIcon />
            </ToolbarButton>
          </div>

          {/* Deshacer/Rehacer */}
          <div className="flex items-center gap-0.5 pl-2 ml-auto border-l border-white/10">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Deshacer (Ctrl+Z)"
            >
              <UndoIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rehacer (Ctrl+Y)"
            >
              <RedoIcon />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* LO QUE ANTES PEDIA prompt(). Un dialogo por cada cosa, con su ayuda. */}
      <DialogoDeUnDato
        abierto={pidiendo === 'enlace'}
        titulo="Enlace"
        ayuda="Déjalo en blanco para quitar el enlace y dejar solo el texto."
        etiqueta="Dirección (empezando por https://)"
        marcaDeAgua="https://ejemplo.com/pagina"
        valorInicial={urlDelEnlace}
        textoDeConfirmar="Poner el enlace"
        onConfirmar={ponerElDato}
        onCancelar={() => setPidiendo(null)}
      />
      <DialogoDeUnDato
        abierto={pidiendo === 'imagen'}
        titulo="Imagen"
        ayuda="La dirección de una imagen ya publicada. Se verá con el ancho del texto."
        etiqueta="Dirección de la imagen"
        marcaDeAgua="https://ejemplo.com/imagen.jpg"
        textoDeConfirmar="Insertar la imagen"
        onConfirmar={ponerElDato}
        onCancelar={() => setPidiendo(null)}
      />
      <DialogoDeUnDato
        abierto={pidiendo === 'youtube'}
        titulo="Vídeo de YouTube"
        ayuda="Pega la dirección del vídeo tal cual, la de la barra del navegador."
        etiqueta="Dirección del vídeo"
        marcaDeAgua="https://www.youtube.com/watch?v=…"
        textoDeConfirmar="Insertar el vídeo"
        onConfirmar={ponerElDato}
        onCancelar={() => setPidiendo(null)}
      />
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  size?: 'sm' | 'md'
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  size = 'md',
  children
}: ToolbarButtonProps) {
  const sizeClasses = size === 'sm' ? 'p-1' : 'p-1.5'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses} rounded transition-colors
        ${active
          ? 'bg-brand-light/20 text-brand-light'
          : 'text-white/60 hover:text-white hover:bg-white/10'
        }
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  )
}

function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  )
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4" />
    </svg>
  )
}

function StrikeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M9 4v4m6-4v4M9 16v4m6-4v4" />
    </svg>
  )
}

function BulletListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function OrderedListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 12h14M7 4h14" />
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TableIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 10h16M4 14h16M10 4v16M16 4v16" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
    </svg>
  )
}

export default RichTextEditor
