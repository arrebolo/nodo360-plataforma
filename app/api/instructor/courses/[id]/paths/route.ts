/**
 * Las rutas de aprendizaje de un curso propio: asignar y quitar.
 *
 * ES LA MISMA IMPLEMENTACION que `/api/admin/courses/[id]/paths`, reexportada, no una
 * copia. Esa ruta ya decide por curso con `permisoSobreElCurso()` —admin cualquiera,
 * mentor cualquiera, instructor solo los suyos—, así que el permiso no cambia; lo que
 * cambia es que la pantalla del instructor deja de llamar a /api/admin.
 *
 * Una copia aquí se desfasaría: son tres verbos con comprobaciones de posición y de
 * duplicados, y el fallo se vería como «al instructor le deja algo que al admin no».
 */
export { GET, POST, DELETE } from '../../../../admin/courses/[id]/paths/route'
