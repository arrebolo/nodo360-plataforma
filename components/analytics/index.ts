// Analytics components
//
// `GoogleAnalytics` es el envoltorio de servidor: resuelve el rol y decide.
// La etiqueta en si esta en GoogleAnalyticsTag.tsx, que es de cliente porque
// necesita usePathname().
export { default as GoogleAnalytics } from './GoogleAnalyticsServer'
export { default as SignUpTracker } from './SignUpTracker'
// `CursoEmpezado` emite course_start cuando la matricula no pasa por el boton:
// por cookie (el enlace de la ficha) o por propiedad (el examen final).
export { default as CursoEmpezado } from './CursoEmpezado'
