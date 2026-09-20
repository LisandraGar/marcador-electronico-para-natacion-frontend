#!/usr/bin/env node

/**
 * Hook de seguridad Pre-Commit para prevenir la filtración de secretos y credenciales.
 * Inspecciona los archivos y cambios preparados para commit (staged).
 */

import { execSync } from 'child_process'

// 1. Archivos que NUNCA deben estar en el commit
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\.local$/i,
  /^\.env\.development$/i,
  /^\.env\.production$/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /credentials\.json$/i,
  /^settings\.toml$/i, // settings.toml en frontend nunca debe existir
]

// 2. Patrones de contenido sensible en líneas agregadas (+)
const FORBIDDEN_CONTENT_PATTERNS = [
  {
    name: 'Contraseña MQTT en Frontend (VITE_MQTT_PASSWORD con valor)',
    regex: /^\+[ \t]*VITE_MQTT_PASSWORD[ \t]*=[ \t]*['"]?[^\s'"]{2,}['"]?/m,
  },
  {
    name: 'Contraseña MQTT en Firmware (MQTT_PASSWORD con valor)',
    regex: /^\+[ \t]*MQTT_PASSWORD[ \t]*=[ \t]*['"][^\s'"]{2,}['"]/m,
  },
  {
    name: 'Contraseña WiFi (CIRCUITPY_WIFI_PASSWORD con valor)',
    regex: /^\+[ \t]*CIRCUITPY_WIFI_PASSWORD[ \t]*=[ \t]*['"][^\s'"]{2,}['"]/m,
  },
  {
    name: 'Clave privada RSA / SSH / Certificado',
    regex: /^\+[ \t]*-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/m,
  },
  {
    name: 'Asignación de clave secreta (api_key, secret_key, client_secret)',
    regex: /^\+[ \t]*(api_key|secret_key|client_secret|auth_token)[ \t]*=[ \t]*['"][^\s'"]{8,}['"]/im,
  },
]

function main() {
  let stagedFiles = []
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf-8' })
    stagedFiles = output.split('\n').map((f) => f.trim()).filter(Boolean)
  } catch (err) {
    console.error('Error al inspeccionar archivos staged de Git:', err.message)
    process.exit(1)
  }

  if (stagedFiles.length === 0) {
    process.exit(0)
  }

  const errors = []

  // Verificación 1: Nombres de archivos prohibidos
  for (const file of stagedFiles) {
    for (const pattern of FORBIDDEN_FILE_PATTERNS) {
      if (pattern.test(file)) {
        errors.push(`📁 Archivo prohibido detectado en staged: "${file}". No se permite commitear este archivo.`)
      }
    }
  }

  // Verificación 2: Contenido sensible en el diff preparado
  let diffContent = ''
  try {
    diffContent = execSync('git diff --cached -U0', { encoding: 'utf-8' })
  } catch (err) {
    console.error('Error al leer git diff:', err.message)
    process.exit(1)
  }

  const lines = diffContent.split('\n')
  for (const line of lines) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue

    for (const rule of FORBIDDEN_CONTENT_PATTERNS) {
      if (rule.regex.test(line)) {
        errors.push(`🔑 ${rule.name}\n   Línea detectada: ${line.trim()}`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n' + '='.repeat(70))
    console.error('🛑 [PRE-COMMIT BLOQUEADO]: AUDITORÍA DE SEGURIDAD FALLIDA')
    console.error('='.repeat(70))
    console.error('Se detectaron secretos o archivos prohibidos listos para commit:\n')
    errors.forEach((err, idx) => {
      console.error(`  ${idx + 1}. ${err}`)
    })
    console.error('\n💡 Solución:')
    console.error('  - Desvincula archivos de Git con: git reset HEAD <archivo>')
    console.error('  - Para contraseñas, deja el valor vacío o usa variables en localStorage.')
    console.error('='.repeat(70) + '\n')
    process.exit(1)
  }

  console.log('🛡️ [Pre-Commit]: Auditoría de seguridad aprobada. Ningún secreto detectado.')
  process.exit(0)
}

main()
