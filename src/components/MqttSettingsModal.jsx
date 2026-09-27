import { useState, useEffect } from 'react'
import { X, Save, RotateCcw, ShieldCheck, Radio, Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { getStoredMqttConfig, saveStoredMqttConfig, resetStoredMqttConfig } from '../hooks/use-mqtt'

export const MqttSettingsModal = ({ isOpen, onClose, currentStatus, currentError }) => {
  const [form, setForm] = useState(getStoredMqttConfig)
  const [showPassword, setShowPassword] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Sincronizar campos con la configuración activa cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setForm(getStoredMqttConfig())
      setSavedSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isGuestSelected = (form.username || '').toLowerCase().includes('invitado')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSavedSuccess(false)
  }

  const handleSelectPreset = (user) => {
    if (user === 'marcador_web_invitado') {
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web_invitado',
        password: 'marcador_web_invitado',
      }))
    } else {
      // Perfil Operador: selecciona marcador_web y conserva la contraseña si ya fue ingresada previamente
      const stored = getStoredMqttConfig()
      const existingOperatorPass = stored.username === 'marcador_web' ? stored.password : ''
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web',
        password: existingOperatorPass,
      }))
    }
    setSavedSuccess(false)
  }

  const handleSave = (e) => {
    e?.preventDefault()
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
        <div className="px-6 pt-4 space-y-2">
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

          {/* Badge del Rol Activo */}
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
            isGuestSelected
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-center gap-1.5">
              {isGuestSelected ? <Lock size={14} className="text-cyan-400" /> : <Unlock size={14} className="text-emerald-400" />}
              <span>
                Perfil: <strong>{isGuestSelected ? 'Modo Espectador' : 'Modo Operador'}</strong>
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold opacity-80">
              {isGuestSelected ? 'Solo Lectura' : 'Control Total'}
            </span>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Selector Rápido de Perfil: Espectador vs Operador */}
          <div className="space-y-1.5 pb-2 border-b border-gray-800">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
              Seleccionar Perfil de Acceso Rápido:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('marcador_web_invitado', 'marcador_web_invitado')}
                className={`p-2.5 rounded-xl border text-xs font-mono font-medium flex flex-col items-center justify-center transition-all ${
                  isGuestSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="font-bold flex items-center gap-1">
                  <Lock size={12} /> Espectador
                </span>
                <span className="text-[10px] opacity-75">Solo Lectura (Público)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('marcador_web')}
                className={`p-2.5 rounded-xl border text-xs font-mono font-medium flex flex-col items-center justify-center transition-all ${
                  !isGuestSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="font-bold flex items-center gap-1">
                  <Unlock size={12} /> Operador
                </span>
                <span className="text-[10px] opacity-75">Control Total (Mesa)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="mqtt-host-input" className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
              Host / URL del Broker (sin wss://)
            </label>
            <input
              type="text"
              id="mqtt-host-input"
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
              <label htmlFor="mqtt-port-input" className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Puerto WSS
              </label>
              <input
                type="number"
                id="mqtt-port-input"
                name="port"
                value={form.port}
                onChange={handleChange}
                placeholder="8884"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="mqtt-user-input" className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
                Usuario MQTT
              </label>
              <input
                type="text"
                id="mqtt-user-input"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="usuario"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="mqtt-pass-input" className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5">
              Contraseña MQTT {isGuestSelected ? '(Automática para Espectador)' : '(Ingresa tu contraseña)'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="mqtt-pass-input"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={isGuestSelected ? 'marcador_web_invitado' : 'Ingresa la contraseña de operador'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-100 font-mono focus:border-emerald-500 focus:outline-none transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-800/60 p-2.5 rounded-lg border border-gray-800 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Estos ajustes se almacenan localmente en este navegador. El modo espectador es el predeterminado para el público general.
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
              title="Restablecer a valores por defecto (Invitado)"
            >
              <RotateCcw size={14} />
              Valores por defecto
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
