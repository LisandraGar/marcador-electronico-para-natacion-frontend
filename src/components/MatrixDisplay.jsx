import {  charPatterns, defaultChar } from '../utils/characters'

export const MatrixDisplay = ({ text = "", textColor = "#10B981", inactiveColor = "#000000" }) => {
    const columns = 128
    const rows = 32
    const pixelSize = 'w-2 h-2'
    const borderColor = 'bg-gray-800'
    const backgroundColor = '#080707'
    const fontSize = 'small'


    // Función para convertir texto en píxeles de la matriz
    const textToMatrix = (text) => {
        const activePixels = new Set()

        if (!text) return activePixels

        let currentX = 2 // Margen izquierdo
        let currentY = 2 // Margen superior
        const charWidth = fontSize === 'small' ? 5 : 10
        const charHeight = fontSize === 'small' ? 7 : 16
        const spacingX = fontSize === 'small' ? 1 : 2
        const spacingY = 3
        const dimentionChar = `${charWidth}x${charHeight}`

        const lines = text.split('\n')

        let y = 0, x = 0
        lines.forEach(line => {
            line.split('').forEach(char => {
                const pattern = charPatterns[dimentionChar][char] || defaultChar[dimentionChar]
    
                // Dibujar el carácter en la matriz
                for (y = 0; y < charHeight; y++) {
                    for (x = 0; x < charWidth; x++) {
                        if (pattern[y][x] === 1) {
                            const pixelY = currentY + y
                            const pixelX = currentX + x
                            if (pixelX < columns && pixelY < rows) {
                                activePixels.add(pixelY * columns + pixelX)
                            }
                        }
                    }
                }
    
                currentX += charWidth + spacingX
    
                // Si nos quedamos sin espacio, salir
                if (currentX >= columns - 2) return
            })
            currentY = currentY + charHeight + spacingY
            currentX = 2
        })

        return activePixels
    }

    const activePixels = textToMatrix(text)

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-900">
            <h1 className="text-2xl font-bold text-green-400 mb-6 font-mono">
                MATRIX PORTAL S3 - 128x64
            </h1>

            <div className={`${borderColor} p-6 rounded-lg`}>
                <div className={`${borderColor} p-4 rounded-md`}>
                    <div className={`p-3 rounded-sm`} style={{ backgroundColor }}>
                        <div
                            className="grid gap-0.5"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                            }}
                        >
                            {Array.from({ length: rows * columns }).map((_, index) => {
                                const isActive = activePixels.has(index)
                                return (
                                    <div
                                        key={index}
                                        className={`${pixelSize} rounded-sm transition-all duration-200 ${isActive ? '' : inactiveColor
                                            } hover:opacity-80`}
                                        style={{
                                            backgroundColor: isActive ? textColor : inactiveColor
                                        }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-green-300 font-mono text-sm">
                        {text || "ESCRIBE ALGO..."}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        128 × 64 RGB LED Matrix
                    </p>
                </div>
            </div>
        </div>
    )
}