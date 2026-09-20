import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Menta', hex: '#34D399' },
  { name: 'Cian', hex: '#22D3EE' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Lima', hex: '#84CC16' },
  { name: 'Naranja', hex: '#FB923C' },
  { name: 'Turquesa', hex: '#14B8A6' },
];

export const ColorPicker = ({
  color = '#10B981',
  onColorChange,
  className = '',
}) => {
  const [internalColor, setInternalColor] = useState(color);

  useEffect(() => {
    setInternalColor(color);
  }, [color]);

  const handleSelect = (newColor) => {
    setInternalColor(newColor);
    onColorChange?.(newColor);
  };

  return (
    <div className={`p-4 bg-gray-900/90 border border-gray-800 rounded-xl space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-300">
          <Palette size={14} className="text-emerald-400" />
          Color del Texto LED
        </label>
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-gray-700 shadow-xs"
          style={{ color: internalColor }}
        >
          {internalColor.toUpperCase()}
        </span>
      </div>

      {/* Selector personalizado */}
      <div className="flex items-center gap-3">
        <label className="relative cursor-pointer shrink-0">
          <div
            className="w-10 h-10 rounded-lg border-2 border-gray-700 shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: internalColor }}
          />
          <input
            type="color"
            value={internalColor}
            onChange={(e) => handleSelect(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Seleccionar color personalizado"
          />
        </label>

        <input
          type="text"
          value={internalColor}
          onChange={(e) => handleSelect(e.target.value)}
          placeholder="#10B981"
          maxLength={7}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Paleta de presets responsive */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
        {PRESET_COLORS.map(({ name, hex }) => {
          const isSelected = internalColor.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => handleSelect(hex)}
              className={`h-7 rounded-md transition-all flex items-center justify-center border ${
                isSelected
                  ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)] ring-1 ring-white/50'
                  : 'border-transparent hover:scale-105 hover:border-gray-500'
              }`}
              style={{ backgroundColor: hex }}
              title={`${name} (${hex})`}
              aria-label={`Seleccionar color ${name}`}
            >
              {isSelected && (
                <Check
                  size={14}
                  className={hex === '#FFFFFF' || hex === '#34D399' || hex === '#22D3EE' ? 'text-black' : 'text-white'}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
