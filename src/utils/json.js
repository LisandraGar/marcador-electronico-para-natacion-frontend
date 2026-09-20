/**
 * Parsea una cadena JSON de forma segura sin lanzar excepciones.
 * @param {string|any} text - Texto a parsear
 * @param {any} fallback - Valor devuelto si falla el parseo o text es nulo
 * @returns {any} Objeto parseado o fallback
 */
export function safeJsonParse(text, fallback = null) {
  if (text === null || text === undefined || text === '') {
    return fallback
  }

  // Si ya es un objeto o array, retornarlo directamente
  if (typeof text === 'object') {
    return text
  }

  try {
    return JSON.parse(text)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ safeJsonParse: No se pudo parsear el valor JSON:', text, err)
    }
    return fallback
  }
}
