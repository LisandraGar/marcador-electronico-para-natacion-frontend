import { useState } from 'react';

export const ColorPicker = ({ onColorChange }) => {
    const [selectedColor, setSelectedColor] = useState('#10B981'); // Verde por defecto (como Matrix)

    // Colores predefinidos inspirados en Matrix
    const matrixColors = [
        '#10B981', // green-500
        '#059669', // green-600
        '#047857', // green-700
        '#34D399', // green-400
        '#6EE7B7', // green-300
        '#A7F3D0', // green-200
        '#22D3EE', // cyan-400
        '#06B6D4', // cyan-500
        '#0891B2', // cyan-600
        '#8B5CF6', // violet-500
        '#7C3AED', // violet-600
        '#EC4899', // pink-500
        '#F59E0B', // amber-500
        '#EF4444', // red-500
        '#3B82F6', // blue-500
        '#FFFFFF', // blanco
    ];

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        if (onColorChange) {
            onColorChange(color);
        }
    };

    const handleCustomColor = (e) => {
        const color = e.target.value;
        setSelectedColor(color);
        if (onColorChange) {
            onColorChange(color);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-green-400 mb-4 font-mono text-center">
                MATRIX COLOR PICKER
            </h2>

            {/* Color seleccionado actualmente */}
            <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-600 shadow-md"
                        style={{ backgroundColor: selectedColor }}
                    />
                    <div className="text-green-300 font-mono">
                        <div className="text-sm">SELECCIONADO</div>
                        <div className="text-lg font-bold">{selectedColor.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            {/* Selector de color personalizado */}
            <div className="mb-6">
                <label className="block text-green-300 font-mono text-sm mb-2 text-center">
                    COLOR PERSONALIZADO
                </label>
                <div className="flex items-center justify-center gap-3">
                    <input
                        type="color"
                        value={selectedColor}
                        onChange={handleCustomColor}
                        className="w-12 h-12 cursor-pointer bg-transparent border-none"
                    />
                    <input
                        type="text"
                        value={selectedColor}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        className="bg-gray-700 text-green-300 font-mono px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none w-32 text-center"
                    />
                </div>
            </div>

            {/* Paleta de colores predefinidos */}
            <div className="mb-4">
                <label className="block text-green-300 font-mono text-sm mb-3 text-center">
                    PALETA DE COLORES
                </label>
                <div className="grid grid-cols-8 gap-2">
                    {matrixColors.map((color, index) => (
                        <button
                            key={index}
                            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${selectedColor === color ? 'border-green-400 shadow-lg scale-110' : 'border-gray-600'
                                }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
