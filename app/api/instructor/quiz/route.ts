/**
 * El examen final de un curso propio: sus preguntas.
 *
 * ES LA MISMA IMPLEMENTACION que `/api/admin/quiz`, reexportada. Esa ruta ya decide por
 * curso con `permisoSobreElExamen()` —y desde la 115 no deja a un instructor tocar el
 * examen de un curso ajeno ni el de uno publicado—, así que el permiso es el mismo; lo
 * que cambia es que el editor del instructor deja de llamar a /api/admin.
 */
export { GET, POST, PUT, DELETE } from '../../admin/quiz/route'
