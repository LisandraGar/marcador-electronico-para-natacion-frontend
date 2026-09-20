import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Play,
  Pause,
  RotateCw,
  Trash2,
  UserPlus,
  Clock,
  Thermometer,
  Monitor,
  CheckCircle2,
  Users,
  Timer
} from 'lucide-react'
import { ColorPicker } from './ColorPicker'

export const TextInputForm = ({
  onTextSubmit,
  onColorChange,
  timeRTC,
  timeChrono,
  setTimeChrono,
  userData = [],
  scores = [],
  publish,
  temp = '28',
  setTemp,
  currentScreen = 'show',
  twoRecords = [],
}) => {
  const [textColor, setTextColor] = useState('#10B981')
  const [timeInput, setTimeInput] = useState('12:00')
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    cedula: '',
  })
  const [formError, setFormError] = useState('')
  const [isPlayChrono, setIsPlayChrono] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  // Muestra una notificación temporal de acción completada
  const notifyAction = (text) => {
    setActionNotice(text)
    setTimeout(() => setActionNotice(null), 2500)
  }

  // Centraliza el formato de texto para la matriz LED
  const formatMatrixText = useCallback(
    (h, m, ampm, t, tc, tr, scr) => {
      const activeRecords = (scores && scores.length <= 2 && scores.length > 0) ? scores : (tr || [])

      const t_hh = String(h ?? 0).padStart(2, '0')
      const t_mm = String(m ?? 0).padStart(2, '0')
      const c_hh = String(tc?.hh ?? 0).padStart(2, '0')
      const c_mm = String(tc?.mm ?? 0).padStart(2, '0')
      const c_ss = String(tc?.ss ?? 0).padStart(2, '0')
      const c_ms = String(tc?.ms ?? 0).padStart(2, '0')

      if (scr === 'chrono') {
        return `    ${t_hh}:${t_mm} ${ampm} - ${t}°\n  Round|HH|MM|SS|MS\n    ${tc?.id ?? 0}  |${c_hh}|${c_mm}|${c_ss}|${c_ms}`
      }

      const tr0 = activeRecords[0]
      const tr1 = activeRecords[1]

      const tr0_str = tr0
        ? `RECORDS ${tr0.id}.${String(tr0.hh ?? 0).padStart(2, '0')}:${String(tr0.mm ?? 0).padStart(2, '0')}:${String(tr0.ss ?? 0).padStart(2, '0')}.${String(tr0.ms ?? 0).padStart(2, '0')}`
        : 'RECORDS'

      const tr1_str = tr1
        ? `${tr1.id}.${String(tr1.hh ?? 0).padStart(2, '0')}:${String(tr1.mm ?? 0).padStart(2, '0')}:${String(tr1.ss ?? 0).padStart(2, '0')}.${String(tr1.ms ?? 0).padStart(2, '0')}`
        : ''

      return `${t_hh}:${t_mm} ${ampm}      HEAT ${t}\n${tr0_str}\n        ${tr1_str}`
    },
    [scores]
  )

  // Actualiza el texto de la matriz cuando cambian el RTC, cronómetro, temperatura, pantalla o registros
  useEffect(() => {
    const formatted = formatMatrixText(
      timeRTC?.hours ?? 0,
      timeRTC?.minutes ?? 0,
      timeRTC?.ampm ?? 'AM',
      temp,
      timeChrono,
      twoRecords,
      currentScreen
    )
    onTextSubmit(formatted)
  }, [timeRTC, timeChrono, temp, twoRecords, currentScreen, formatMatrixText, onTextSubmit])

  // Control del cronómetro por nadador (Play / Pausa)
  const handleChronoToggle = (id) => {
    const currentState = Boolean(isPlayChrono[id])
    const nextState = !currentState
    setIsPlayChrono((prev) => ({ ...prev, [id]: nextState }))

    const command = nextState ? `play_chrono:${id}` : `pause_chrono:${id}`
    publish('esp32s3/chrono', command)
    notifyAction(`${nextState ? 'Iniciado' : 'Pausado'} cronómetro #${id}`)
  }

  // Reiniciar score/tiempo de un nadador
  const handleResetScore = (id) => {
    publish('esp32s3/del_score', String(id))
    publish('esp32s3/get_users', 'get_users')
    setTimeChrono({ id: null, hh: null, mm: null, ss: null, ms: null })
    setIsPlayChrono((prev) => ({ ...prev, [id]: false }))
    notifyAction(`Tiempo reiniciado para nadador #${id}`)
  }

  // Eliminar nadador definitivamente
  const handleDeleteUser = (id) => {
    publish('esp32s3/del_record', String(id))
    publish('esp32s3/get_users', 'get_users')
    setConfirmDeleteId(null)
    notifyAction(`Nadador #${id} eliminado`)
  }

  // Agregar nuevo nadador
  const handleAddUser = (e) => {
    e?.preventDefault()
    setFormError('')

    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    if (!formData.cedula.trim()) {
      setFormError('La cédula es obligatoria.')
      return
    }

    const nextId = (userData?.length || 0) + 1
    const payload = {
      id: nextId,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      edad: Number(formData.edad) || 0,
      cedula: formData.cedula.trim(),
    }

    publish('esp32s3/new_user', JSON.stringify(payload))
    publish('esp32s3/get_users', 'get_users')
    setFormData({ nombre: '', apellido: '', edad: '', cedula: '' })
    notifyAction(`Nadador ${payload.nombre} registrado con éxito`)
  }

  // Ajustar hora RTC manual
  const sendTimeToRTC = () => {
    if (!timeInput) return
    publish('esp32s3/settime', timeInput)
    notifyAction(`Hora RTC enviada: ${timeInput}`)
  }

  // Sincronizar RTC con el reloj local de la computadora/dispositivo
  const syncWithDeviceTime = () => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const localTime = `${hh}:${mm}`
    setTimeInput(localTime)
    publish('esp32s3/settime', localTime)
    notifyAction(`Hora sincronizada con dispositivo: ${localTime}`)
  }

  // Cambio de temperatura
  const sendTempToDisplay = () => {
    publish('esp32s3/settemp', String(temp))
    notifyAction(`Temperatura configurada: ${temp}°C`)
  }

  const handleChangeTemp = (e) => {
    const value = e.target.value
    if (value === '') {
      setTemp('')
      return
    }
    const num = Number(value)
    if (!isNaN(num) && num >= 10 && num <= 60) {
      setTemp(value)
    }
  }

  // Color de texto
  const handleTextColorChange = (color) => {
    setTextColor(color)
    onColorChange?.(color)
    publish('esp32s3/setcolor', color)
  }

  // Cambio de modo de pantalla
  const handleScreenType = (type) => {
    publish('esp32s3/screen_type', type)
    notifyAction(`Pantalla cambiada a modo ${type === 'chrono' ? 'CRONÓMETRO' : 'VISUALIZACIÓN'}`)
  }

  const swimmersList = useMemo(() => {
    return (userData || []).map((user) => {
      const userScore = scores?.find((s) => String(s.id) === String(user.id))
      const hh = String(userScore?.hh ?? 0).padStart(2, '0')
      const mm = String(userScore?.mm ?? 0).padStart(2, '0')
      const ss = String(userScore?.ss ?? 0).padStart(2, '0')
      const ms = String(userScore?.ms ?? 0).padStart(2, '0')
      const timeFormatted = `${hh}:${mm}:${ss}.${ms}`
      return {
        ...user,
        timeFormatted,
        hasScore: Boolean(userScore),
      }
    })
  }, [userData, scores])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Notificación flotante de confirmación de acción */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xs font-mono text-xs animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Grid principal responsive: 1 columna en móvil, 12 columnas en pantallas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================
            COLUMNA IZQUIERDA: GESTIÓN DE NADADORES Y CRONÓMETRO (7 cols)
        ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            {/* Cabecera de Nadadores */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold font-mono text-gray-200 uppercase tracking-wider">
                  Nadadores y Tiempos de Competencia
                </h3>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {swimmersList.length} {swimmersList.length === 1 ? 'Nadador' : 'Nadadores'}
              </span>
            </div>

            {/* Lista de Nadadores: Versión Cards en Móviles / Tabla en Escritorio */}
            {swimmersList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 font-mono text-xs border border-dashed border-gray-800 rounded-xl bg-gray-950/50">
                <Users size={32} className="mx-auto mb-2 text-gray-600" />
                No hay nadadores registrados. Utiliza el formulario inferior para agregar uno.
              </div>
            ) : (
              <>
                {/* Vista Tarjetas para Móviles (hidden en md+) */}
                <div className="block md:hidden space-y-3">
                  {swimmersList.map((swimmer) => {
                    const isRunning = Boolean(isPlayChrono[swimmer.id])
                    return (
                      <div
                        key={swimmer.cedula || swimmer.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isRunning
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                            : 'bg-gray-850 border-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mr-2">
                              #{String(swimmer.id).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-gray-100 text-sm">
                              {swimmer.nombre} {swimmer.apellido}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-gray-400">
                            {swimmer.edad ? `${swimmer.edad} años` : ''}
                          </span>
                        </div>

                        <div className="mt-2 text-xs font-mono text-gray-400">
                          CI: <span className="text-gray-300">{swimmer.cedula || 'S/N'}</span>
                        </div>

                        <div className="mt-2.5 p-2 bg-gray-950 rounded-lg flex items-center justify-between border border-gray-800">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                            <Timer size={14} className={isRunning ? 'text-emerald-400 animate-spin' : 'text-gray-500'} />
                            <span>Tiempo:</span>
                          </div>
                          <span className={`text-base font-mono font-bold ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-gray-200'}`}>
                            {swimmer.timeFormatted}
                          </span>
                        </div>

                        {/* Botones de acción accesibles para touch */}
                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-gray-800">
                          <button
                            type="button"
                            onClick={() => handleChronoToggle(swimmer.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all ${
                              isRunning
                                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {isRunning ? <Pause size={15} /> : <Play size={15} />}
                            <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetScore(swimmer.id)}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300 border border-gray-700 transition-colors"
                            title="Reiniciar cronómetro"
                          >
                            <RotateCw size={16} />
                          </button>

                          {confirmDeleteId === swimmer.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(swimmer.id)}
                                className="px-2 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono rounded-lg transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-2 bg-gray-800 text-gray-300 text-xs font-mono rounded-lg"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(swimmer.id)}
                              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 border border-gray-700 transition-colors"
                              title="Eliminar nadador"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Vista Tabla para Pantallas Medianas y Grandes (hidden en mobile) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/60">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-gray-800/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Apellido</th>
                        <th className="py-2.5 px-2">Edad</th>
                        <th className="py-2.5 px-3">Cédula</th>
                        <th className="py-2.5 px-3">Tiempo</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {swimmersList.map((swimmer) => {
                        const isRunning = Boolean(isPlayChrono[swimmer.id])
                        return (
                          <tr
                            key={swimmer.cedula || swimmer.id}
                            className={`transition-colors ${
                              isRunning ? 'bg-emerald-950/20' : 'hover:bg-gray-850/50'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-emerald-400">
                              #{String(swimmer.id).padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3 text-gray-200">{swimmer.nombre}</td>
                            <td className="py-2.5 px-3 text-gray-300">{swimmer.apellido}</td>
                            <td className="py-2.5 px-2 text-gray-400">{swimmer.edad || '—'}</td>
                            <td className="py-2.5 px-3 text-gray-400">{swimmer.cedula}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  isRunning
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'text-gray-300'
                                }`}
                              >
                                {swimmer.timeFormatted}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleChronoToggle(swimmer.id)}
                                  className={`p-1.5 rounded transition-all ${
                                    isRunning
                                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                  title={isRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro'}
                                >
                                  {isRunning ? <Pause size={14} /> : <Play size={14} />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleResetScore(swimmer.id)}
                                  className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 transition-colors"
                                  title="Reiniciar tiempo"
                                >
                                  <RotateCw size={14} />
                                </button>

                                {confirmDeleteId === swimmer.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(swimmer.id)}
                                      className="px-2 py-1 bg-red-600 text-white text-[10px] rounded"
                                    >
                                      Sí
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 bg-gray-700 text-gray-300 text-[10px] rounded"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(swimmer.id)}
                                    className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-red-400 border border-gray-700 transition-colors"
                                    title="Eliminar nadador"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Formulario para registrar nuevo nadador */}
            <form onSubmit={handleAddUser} className="mt-5 p-3.5 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-gray-300 font-bold">
                <UserPlus size={15} className="text-emerald-400" />
                <span>Registrar Nuevo Nadador</span>
                <span className="text-[10px] text-gray-500 font-normal ml-auto">
                  Siguiente ID: #{(userData?.length || 0) + 1}
                </span>
              </div>

              {formError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg font-mono">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Edad"
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Cédula / DNI *"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                  <UserPlus size={14} />
                  <span>Agregar Nadador</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================
            COLUMNA DERECHA: AJUSTES DE PANTALLA, RTC, TEMP Y COLOR (5 cols)
        ======================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Selector de Modo de Pantalla (Visualización vs Cronómetro) */}
          <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
              <Monitor size={15} className="text-emerald-400" />
              <span>Modo de Visualización Display</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleScreenType('show')}
                className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all border ${
                  currentScreen === 'show'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                }`}
              >
                VISUALIZACIÓN (Records)
              </button>

              <button
                type="button"
                onClick={() => handleScreenType('chrono')}
                className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all border ${
                  currentScreen === 'chrono'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                }`}
              >
                CRONÓMETRO (En Vivo)
              </button>
            </div>
          </div>

          {/* Ajuste de Hora RTC (DS1307) con sincronización automática */}
          <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
                <Clock size={15} className="text-emerald-400" />
                <span>Hora RTC (DS1307)</span>
              </div>
              {timeRTC?.hours !== null && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ESP32: {String(timeRTC?.hours ?? 0).padStart(2, '0')}:{String(timeRTC?.minutes ?? 0).padStart(2, '0')} {timeRTC?.ampm}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={sendTimeToRTC}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-medium rounded-lg shadow transition-all active:scale-95"
              >
                Enviar
              </button>
            </div>

            <button
              type="button"
              onClick={syncWithDeviceTime}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
            >
              <Clock size={13} />
              <span>Sincronizar con reloj de este dispositivo</span>
            </button>
          </div>

          {/* Ajuste de Temperatura Ambiente */}
          <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-300 font-bold">
                <Thermometer size={15} className="text-emerald-400" />
                <span>Temperatura Ambiente (LM35)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {temp}°C
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="60"
                value={temp}
                onChange={handleChangeTemp}
                placeholder="28"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={sendTempToDisplay}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-medium rounded-lg shadow transition-all active:scale-95"
              >
                Establecer
              </button>
            </div>
          </div>

          {/* Selector de Color Integrado */}
          <ColorPicker
            color={textColor}
            onColorChange={handleTextColorChange}
          />
        </div>
      </div>
    </div>
  )
}