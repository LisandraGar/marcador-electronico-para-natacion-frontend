import { useState, useEffect } from 'react'
import {
  X,
  Save,
  RotateCcw,
  Radio,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  SlidersHorizontal,
  Server,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react'
import { getStoredMqttConfig, saveStoredMqttConfig, resetStoredMqttConfig } from '../hooks/use-mqtt'

export const MqttSettingsModal = ({ isOpen, onClose, currentStatus, currentError }) => {
  const [form, setForm] = useState(getStoredMqttConfig)
  const [showPassword, setShowPassword] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [viewMode, setViewMode] = useState('simple') // 'simple' | 'advanced'
  const [selectedRole, setSelectedRole] = useState('guest') // 'guest' | 'operator'
  const [operatorPassword, setOperatorPassword] = useState('')

  // Sincronizar campos con la configuración activa cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredMqttConfig()
      setForm(stored)
      setSavedSuccess(false)
      setValidationError('')

      const isGuest = (stored.username || '').toLowerCase().includes('invitado')
      if (isGuest) {
        setSelectedRole('guest')
        setOperatorPassword('')
      } else {
        setSelectedRole('operator')
        setOperatorPassword(stored.password || '')
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const isGuestActive = (form.username || '').toLowerCase().includes('invitado')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setSavedSuccess(false)
    setValidationError('')
  }

  const handleRoleSelectSimple = (role) => {
    setSelectedRole(role)
    setValidationError('')
    setSavedSuccess(false)

    if (role === 'guest') {
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web_invitado',
        password: 'marcador_web_invitado',
      }))
    } else {
      // Perfil operador: seleccionar 'marcador_web'
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web',
        password: operatorPassword,
      }))
    }
  }

  const handleOperatorPasswordChange = (e) => {
    const val = e.target.value
    setOperatorPassword(val)
    setForm((prev) => ({
      ...prev,
      username: 'marcador_web',
      password: val,
    }))
    setValidationError('')
    setSavedSuccess(false)
  }

  const handleSelectPresetAdvanced = (user) => {
    setValidationError('')
    setSavedSuccess(false)
    if (user === 'marcador_web_invitado') {
      setSelectedRole('guest')
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web_invitado',
        password: 'marcador_web_invitado',
      }))
    } else {
      setSelectedRole('operator')
      setForm((prev) => ({
        ...prev,
        username: 'marcador_web',
        password: operatorPassword,
      }))
    }
  }

  const handleSave = (e) => {
    e?.preventDefault()
    setValidationError('')

    // Validar contraseña si seleccionó operador en modo simple
    if (viewMode === 'simple' && selectedRole === 'operator') {
      if (!operatorPassword.trim()) {
        setValidationError('Por favor ingresa la contraseña de operador para continuar.')
        return
      }
    }

    // Validar campos en modo avanzado
    if (viewMode === 'advanced') {
      if (!form.host.trim()) {
        setValidationError('El host del broker MQTT es requerido.')
        return
      }
      if (!form.port.trim()) {
        setValidationError('El puerto WSS es requerido.')
        return
      }
    }

    const payload = {
      host: form.host.trim(),
      port: form.port.trim(),
      username: (viewMode === 'simple' && selectedRole === 'guest')
        ? 'marcador_web_invitado'
        : form.username.trim(),
      password: (viewMode === 'simple' && selectedRole === 'guest')
        ? 'marcador_web_invitado'
        : (viewMode === 'simple' && selectedRole === 'operator')
        ? operatorPassword.trim()
        : form.password.trim(),
    }

    saveStoredMqttConfig(payload)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  const handleReset = () => {
    resetStoredMqttConfig()
    const stored = getStoredMqttConfig()
    setForm(stored)
    setSelectedRole('guest')
    setOperatorPassword('')
    setSavedSuccess(false)
    setValidationError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[92vh]">
        {/* ========================================================
            MODAL HEADER
        ======================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-850/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wide">
                Conexión y Acceso MQTT
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                {viewMode === 'simple' ? 'Vista Rápida de Perfil' : 'Configuración Técnica Avanzada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================
            BARRA DE ESTADO DE CONEXIÓN + SELECTOR DE VISTA
        ======================================================== */}
        <div className="px-5 pt-3.5 pb-2 space-y-2.5 bg-gray-900">
          {/* Status badge */}
          <div className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center justify-between ${
            currentStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : currentStatus === 'connecting' || currentStatus === 'reconnecting'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                currentStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : currentStatus === 'connecting' || currentStatus === 'reconnecting'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-red-400'
              }`} />
              <span>
                Broker: <strong>{currentStatus.toUpperCase()}</strong>
                {currentError && ` (${currentError})`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold opacity-80">
              {isGuestActive ? 'Perfil Espectador' : 'Perfil Operador'}
            </span>
          </div>

          {/* Toggle entre Vista Simple y Vista Avanzada */}
          <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('simple')
                setValidationError('')
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                viewMode === 'simple'
                  ? 'bg-gray-800 text-emerald-300 shadow-sm border border-gray-700/80 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Vista Simple</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('advanced')
                setValidationError('')
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                viewMode === 'advanced'
                  ? 'bg-gray-800 text-emerald-300 shadow-sm border border-gray-700/80 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Server size={13} />
              <span>Vista Avanzada</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CUERPO DEL FORMULARIO (SCROLLABLE SI ES NECESARIO)
        ======================================================== */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs font-mono text-red-200 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ----------------------------------------------------
              MODO 1: VISTA SIMPLE (INTUITIVA Y SIN DATOS TÉCNICOS)
          ---------------------------------------------------- */}
          {viewMode === 'simple' && (
            <div className="space-y-4">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                Selecciona tu tipo de acceso:
              </span>

              {/* Selector de Tarjetas de Perfil */}
              <div className="grid grid-cols-2 gap-3">
                {/* Opción Espectador */}
                <button
                  type="button"
                  onClick={() => handleRoleSelectSimple('guest')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedRole === 'guest'
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                      : 'bg-gray-850/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Eye size={18} />
                    </span>
                    {selectedRole === 'guest' && (
                      <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-gray-100 flex items-center gap-1">
                      <span>Modo Espectador</span>
                    </h4>
                    <p className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                      Visualización pública en vivo
                    </p>
                  </div>
                </button>

                {/* Opción Operador */}
                <button
                  type="button"
                  onClick={() => handleRoleSelectSimple('operator')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedRole === 'operator'
                      ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                      : 'bg-gray-850/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Unlock size={18} />
                    </span>
                    {selectedRole === 'operator' && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-gray-100 flex items-center gap-1">
                      <span>Modo Operador</span>
                    </h4>
                    <p className="text-[10px] font-mono text-emerald-400/80 mt-0.5">
                      Control total de mesa y hardware
                    </p>
                  </div>
                </button>
              </div>

              {/* Detalle contextual según la opción seleccionada */}
              {selectedRole === 'guest' ? (
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    <span>Conexión oficial de espectador lista</span>
                  </div>
                  <p className="text-xs font-sans text-gray-300 leading-relaxed">
                    Recibe la información en tiempo real de los cronómetros, nadadores y pantalla LED directamente desde el marcador en la piscina.
                  </p>
                  <div className="text-[11px] font-mono text-cyan-300/80 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">
                    ✓ Sin contraseñas ni configuración técnica requerida.
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                    <Lock size={15} className="text-emerald-400 shrink-0" />
                    <span>Autenticación de Operador</span>
                  </div>
                  <p className="text-xs font-sans text-gray-300 leading-relaxed">
                    Habilita el inicio, pausa y reinicio de cronómetros, registro de nuevos competidores y ajuste de reloj y pantalla.
                  </p>

                  <div>
                    <label
                      htmlFor="simple-operator-pass"
                      className="block text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold mb-1.5"
                    >
                      Contraseña de Operador:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="simple-operator-pass"
                        name="operatorPassword"
                        value={operatorPassword}
                        onChange={handleOperatorPasswordChange}
                        placeholder="Ingresa la contraseña de operador"
                        autoFocus
                        autoComplete="current-password"
                        className="w-full bg-gray-900 border border-emerald-500/40 rounded-lg pl-3 pr-10 py-2.5 text-sm text-gray-100 font-mono focus:border-emerald-400 focus:outline-none transition-colors"
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
                </div>
              )}

              {/* Acceso discreto a configuración técnica */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className="text-xs font-mono text-gray-400 hover:text-emerald-400 transition-colors underline-offset-4 hover:underline inline-flex items-center gap-1.5"
                >
                  <Server size={13} />
                  <span>Configuración avanzada del servidor (Host, Puerto, Usuario)</span>
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              MODO 2: VISTA AVANZADA (HOST, PUERTO, CREDENCIALES)
          ---------------------------------------------------- */}
          {viewMode === 'advanced' && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-850 border border-gray-800 rounded-xl flex items-start gap-2.5 text-xs text-gray-300">
                <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Configuración técnica para servidores MQTT locales (Mosquitto), clusters en la nube o pruebas de laboratorio.
                </p>
              </div>

              {/* Botones de presets rápidos en vista avanzada */}
              <div className="space-y-1.5 pb-2 border-b border-gray-800">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Preajustes rápidos de usuario:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetAdvanced('marcador_web_invitado')}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                      form.username === 'marcador_web_invitado'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Eye size={12} />
                    <span>Espectador (Invitado)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetAdvanced('marcador_web')}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                      form.username === 'marcador_web'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Unlock size={12} />
                    <span>Operador (Mesa)</span>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mqtt-host-input"
                  className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5"
                >
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
                  <label
                    htmlFor="mqtt-port-input"
                    className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5"
                  >
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
                  <label
                    htmlFor="mqtt-user-input"
                    className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5"
                  >
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
                <label
                  htmlFor="mqtt-pass-input"
                  className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1.5"
                >
                  Contraseña MQTT
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="mqtt-pass-input"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Contraseña del broker"
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
            </div>
          )}

          {savedSuccess && (
            <div className="text-xs text-emerald-400 font-mono text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={15} />
              <span>Configuración guardada. Reconectando al servidor...</span>
            </div>
          )}

          {/* ========================================================
              ACCIONES DEL MODAL
          ======================================================== */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            {viewMode === 'advanced' ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-gray-200 transition-colors px-2 py-1.5 rounded hover:bg-gray-800"
                title="Restablecer a valores de fábrica"
              >
                <RotateCcw size={14} />
                <span>Restablecer</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-gray-500">
                Guardado en este navegador
              </span>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-mono text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save size={14} />
                <span>Guardar y Conectar</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
