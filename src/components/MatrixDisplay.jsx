import { useEffect, useRef, useState, useMemo } from 'react'
import { Maximize2, Minimize2, Eye } from 'lucide-react'
import { charPatterns, defaultChar } from '../utils/characters'

export const MatrixDisplay = ({
  text = '',
  textColor = '#10B981',
  inactiveColor = '#1f242d',
}) => {
  const canvasRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRawText, setShowRawText] = useState(false)

  const columns = 128
  const rows = 32

  // Convertir texto a conjunto de píxeles activos (Set de índices)
  const activePixels = useMemo(() => {
    const active = new Set()
    if (!text) return active

    const charWidth = 5
    const charHeight = 7
    const spacingX = 1
    const spacingY = 3
    const dimentionChar = `${charWidth}x${charHeight}`

    const lines = text.split('\n')
    let currentY = 2

    lines.forEach((line) => {
      let currentX = 2

      line.split('').forEach((char) => {
        // Buscar patrón directo, luego en mayúscula, o el carácter por defecto
        const pattern =
          charPatterns[dimentionChar]?.[char] ||
          charPatterns[dimentionChar]?.[char.toUpperCase()] ||
          defaultChar[dimentionChar]

        if (pattern) {
          for (let y = 0; y < charHeight; y++) {
            for (let x = 0; x < charWidth; x++) {
              if (pattern[y]?.[x] === 1) {
                const pixelY = currentY + y
                const pixelX = currentX + x
                if (pixelX < columns && pixelY < rows) {
                  active.add(pixelY * columns + pixelX)
                }
              }
            }
          }
        }

        currentX += charWidth + spacingX
        if (currentX >= columns - 2) return
      })

      currentY += charHeight + spacingY
    })

    return active
  }, [text])

  // Dibujar matriz en Canvas de alto rendimiento
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resolución interna de alta densidad (1024 x 256 píxeles para retina y nitidez)
    const targetWidth = 1024
    const targetHeight = 256
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    }

    const cellW = targetWidth / columns
    const cellH = targetHeight / rows
    const radius = Math.min(cellW, cellH) * 0.38

    // Fondo del panel físico
    ctx.fillStyle = '#07090e'
    ctx.fillRect(0, 0, targetWidth, targetHeight)

    // Dibujar cada píxel LED
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const index = r * columns + c
        const isActive = activePixels.has(index)
        const centerX = c * cellW + cellW / 2
        const centerY = r * cellH + cellH / 2

        if (isActive) {
          // Resplandor exterior (Glow)
          ctx.save()
          ctx.shadowColor = textColor
          ctx.shadowBlur = 8
          ctx.fillStyle = textColor
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          // Núcleo brillante central para efecto LED 3D
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX - radius * 0.25, centerY - radius * 0.25, radius * 0.28, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // LED inactivo apagado con relieve tenue
          ctx.fillStyle = inactiveColor || '#181b22'
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2)
          ctx.fill()

          // Borde sutil del diodo apagado
          ctx.strokeStyle = '#0e121a'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }
  }, [activePixels, textColor, inactiveColor])

  return (
    <div className={`w-full max-w-5xl mx-auto transition-all duration-300 ${
      isFullscreen
        ? 'fixed inset-0 z-50 bg-black/95 p-4 sm:p-8 flex flex-col justify-center items-center'
        : 'p-2 sm:p-4'
    }`}>
      {/* Marco exterior estilo Scoreboard LED */}
      <div className="w-full bg-gray-900/90 border border-gray-800 rounded-2xl p-3 sm:p-5 shadow-2xl backdrop-blur-xs">
        {/* Cabecera del display */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h2 className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tracking-wider uppercase">
              DISPLAY LED VIRTUAL — 128×32
            </h2>
            <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
              MatrixPortal S3
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title="Alternar texto sin formato"
            >
              <Eye size={14} />
              <span className="hidden sm:inline">Texto</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Minimizar' : 'Maximizar'}</span>
            </button>
          </div>
        </div>

        {/* Contenedor del Canvas con relación de aspecto 4:1 (128x32) */}
        <div className="relative w-full aspect-[4/1] bg-[#05070b] rounded-xl overflow-hidden border border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-center p-1 sm:p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block rounded-lg select-none"
            style={{ imageRendering: 'pixelated' }}
            title="Simulador de matriz LED RGB 128x32"
          />
        </div>

        {/* Vista de texto sin formato */}
        {showRawText && (
          <div className="mt-3 p-3 bg-black/70 border border-gray-800 rounded-lg">
            <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">
              Contenido enviado al display:
            </div>
            <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap break-all bg-gray-950 p-2 rounded border border-gray-800/80">
              {text || '(Vacío)'}
            </pre>
          </div>
        )}

        {/* Pie informativo */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
          <span className="truncate">
            Color: <strong style={{ color: textColor }}>{textColor.toUpperCase()}</strong>
          </span>
          <span>4,096 Píxeles RGB (128×32)</span>
        </div>
      </div>
    </div>
  )
}