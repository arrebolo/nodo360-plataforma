import { redirect } from 'next/navigation'

/**
 * /guia-revision  ·  redireccion
 *
 * La guia vive ahora en /dashboard/instructor/guia, dentro del panel.
 *
 * POR QUE SE MOVIO
 * Estaba en el area publica y solo la enlazaban cuatro pantallas del panel
 * privado: una pagina publica que nadie podia encontrar salvo quien ya era
 * instructor. Y su contenido es operativo —criterios, plazos, motivos de
 * rechazo— no una pagina de presentacion. Lo que si es publico esta en
 * /instructores.
 *
 * POR QUE QUEDA LA REDIRECCION Y NO SE BORRA LA RUTA
 * Porque habia cuatro enlaces vivos apuntando aqui, y aunque se hayan
 * actualizado los cuatro, la URL puede estar en un correo, en un marcador o en
 * la cabeza de alguien. Una redireccion cuesta un fichero de diez lineas; un
 * 404 cuesta que alguien se quede sin saber como funciona la revision.
 */
export default function GuiaRevisionRedireccion() {
  redirect('/dashboard/instructor/guia')
}
