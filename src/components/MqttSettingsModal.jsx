import { useState } from 'react'
import { X, Save, RotateCcw, ShieldCheck, Radio } from 'lucide-react'
import { getStoredMqttConfig, saveStoredMqttConfig, resetStoredMqttConfig } from '../hooks/use-mqtt'

export const MqttSettingsModal = ({ isOpen, onClose, currentStatus, currentError }) => {
  const [form, setForm] = useState(getStoredMqttConfig)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSavedSuccess(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    saveStoredMqttConfig({
      host: form.host.trim(),
      port: form.port.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
    })
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  const handleReset = () => {
    resetStoredMqttConfig()
    setForm(getStoredMqttConfig())
    setSavedSuccess(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-850">
          <div className="flex items-center gap-2">
            <Radio className="text-emerald-400" size={20} />
            <h3 className="text-base font-bold font-mono text-gray-100 uppercase tracking-wide">
              Configuración Broker MQTT (WSS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status banner */}
        <div className="px-6 pt-4">
          <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
            currentStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : currentStatus === 'connecting' || currentStatus === 'reconnecting'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              currentStatus === 'connected' ? 'bg-emerald-400' : currentStatus === 'connecting' || currentStatus === 'reconnecting' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <span>
              Estado actual: <strong>{currentStatus.toUpperCase()}</strong>
              {currentError && ` — ${currentError}`}
            </span>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
              Host / URL del Broker (sin wss://)
            </label>
            <input
              type="text"
              name="host"
              value={form.host}
              onChange={handleChange}
              placeholder="ej: xxxxx.s1.eu.hivemq.cloud"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Puerto WSS
              </label>
              <input
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                placeholder="8884"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Usuario MQTT
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="usuario"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
              Contraseña MQTT
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-800/60 p-2.5 rounded-lg border border-gray-800 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Estos ajustes se almacenan localmente en este navegador. Permite operar la pantalla desde una tablet o móvil al borde de la piscina sin necesidad de recompilar.
            </span>
          </div>

          {savedSuccess && (
            <div className="text-xs text-emerald-400 font-mono text-center bg-emerald-500/10 py-1.5 rounded border border-emerald-500/20">
              ✓ Configuración guardada y reconectando...
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-gray-200 transition-colors px-2 py-1.5 rounded hover:bg-gray-800"
              title="Restablecer a valores de .env"
            >
              <RotateCcw size={14} />
              Valores por defecto (.env)
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-lg shadow-md transition-all"
              >
                <Save size={14} />
                Guardar y Conectar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
