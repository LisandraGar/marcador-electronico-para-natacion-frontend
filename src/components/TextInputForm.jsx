import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
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
  Timer,
  Eye,
  Lock
} from 'lucide-react'
import { ColorPicker } from './ColorPicker'

export const TextInputForm = ({
  onTextSubmit,
  onColorChange,
  timeRTC,
  setTimeRTC,
  timeChrono,
  setTimeChrono,
  userData = [],
  setUserData,
  scores = [],
  setScores,
  publish,
  temp = '28',
  setTemp,
  currentScreen = 'show',
  onScreenChange,
  twoRecords = [],
  isHardwareOnline = false,
  isReadOnly = true,
  onOpenSettings,
}) => {
  const [textColor, setTextColor] = useState('#10B981')
  const [timeInput, setTimeInput] = useState('12:00')
  const [localTemp, setLocalTemp] = useState(temp)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    cedula: '',
  })
  const [formError, setFormError] = useState('')
  const [runningSwimmerId, setRunningSwimmerId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  const colorDebounceRef = useRef(null)

  // Sincronizar input de temperatura cuando el microcontrolador envía nueva medición
  useEffect(() => {
    if (temp !== undefined && temp !== null && temp !== '') {
      setLocalTemp(temp)
    }
  }, [temp])

  // Notificación visual de confirmación de acción
  const notifyAction = (text) => {
    setActionNotice(text)
    setTimeout(() => setActionNotice(null), 2800)
  }

  // Notificación para advertir que se requiere modo operador
  const notifyReadOnly = () => {
    notifyAction('⚠️ Modo Espectador (Solo Lectura): Abre Ajustes ⚙️ para acceder como Operador.')
    onOpenSettings?.()
  }

  // Centraliza el formato de texto para la matriz LED virtual
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

  // Actualiza el texto de la matriz cuando cambian las variables de estado
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

  // Detectar si el cronómetro activo fue detenido externamente (sensor táctil de llegada en piscina o ESP32)
  useEffect(() => {
    if (runningSwimmerId && scores && scores.length > 0) {
      const swimmerHasFinished = scores.some((s) => String(s.id) === String(runningSwimmerId))
      if (swimmerHasFinished) {
        setRunningSwimmerId(null)
      }
    }
  }, [scores, runningSwimmerId])

  // Control del cronómetro por nadador (Play / Pausa)
  const handleChronoToggle = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)
    const isCurrentlyRunning = String(runningSwimmerId) === swimmerIdStr

    if (isCurrentlyRunning) {
      // Pausar cronómetro manualmente
      setRunningSwimmerId(null)
      publish('esp32s3/chrono', `pause_chrono:${swimmerIdStr}`, { qos: 1 })
      notifyAction(`Pausado cronómetro #${id}`)
    } else {
      // Si había otro nadador corriendo, pausar primero
      if (runningSwimmerId) {
        publish('esp32s3/chrono', `pause_chrono:${runningSwimmerId}`, { qos: 1 })
      }

      // Limpiar puntaje previo de este nadador en la UI para que inicie limpio
      // y no sea cancelado inmediatamente por el detector de finalización
      setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))

      // Iniciar estado en vivo
      setRunningSwimmerId(swimmerIdStr)
      publish('esp32s3/chrono', `play_chrono:${swimmerIdStr}`, { qos: 1 })
      notifyAction(`Iniciado cronómetro para nadador #${id}`)
    }
  }

  // Reiniciar score/tiempo de un nadador
  const handleResetScore = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)

    // Actualización optimista de la UI
    setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))

    if (String(runningSwimmerId) === swimmerIdStr) {
      setRunningSwimmerId(null)
      setTimeChrono?.({ id: null, hh: null, mm: null, ss: null, ms: null })
    }

    publish('esp32s3/del_score', swimmerIdStr, { qos: 1 })

    setTimeout(() => {
      publish('esp32s3/get_users', 'get_users', { qos: 1 })
    }, 250)

    notifyAction(`Tiempo reiniciado para nadador #${id}`)
  }

  // Eliminar nadador definitivamente
  const handleDeleteUser = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)

    setUserData?.((prev) => prev.filter((u) => String(u.id) !== swimmerIdStr))
    setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))

    if (String(runningSwimmerId) === swimmerIdStr) {
      setRunningSwimmerId(null)
      setTimeChrono?.({ id: null, hh: null, mm: null, ss: null, ms: null })
    }

    publish('esp32s3/del_record', swimmerIdStr, { qos: 1 })

    setTimeout(() => {
      publish('esp32s3/get_users', 'get_users', { qos: 1 })
    }, 250)

    setConfirmDeleteId(null)
    notifyAction(`Nadador #${id} eliminado`)
  }

  // Agregar nuevo nadador
  const handleAddUser = (e) => {
    e?.preventDefault()
    setFormError('')

    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    if (!formData.nombre.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    if (!formData.cedula.trim()) {
      setFormError('La cédula es obligatoria.')
      return
    }

    const maxId = (userData || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0)
    const nextId = maxId + 1

    const payload = {
      id: nextId,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      edad: Number(formData.edad) || 0,
      cedula: formData.cedula.trim(),
    }

    setUserData?.((prev) => [...prev, payload])

    publish('esp32s3/new_user', JSON.stringify(payload), { qos: 1 })

    setTimeout(() => {
      publish('esp32s3/get_users', 'get_users', { qos: 1 })
    }, 250)

    setFormData({ nombre: '', apellido: '', edad: '', cedula: '' })
    notifyAction(`Nadador ${payload.nombre} registrado con éxito`)
  }

  // Ajustar hora RTC manual
  const sendTimeToRTC = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    if (!timeInput) return

    const parts = timeInput.split(':')
    if (parts.length === 2) {
      const h = Number(parts[0])
      const m = Number(parts[1])
      setTimeRTC?.({
        hours: h,
        minutes: m,
        seconds: 0,
        ampm: h >= 12 ? 'PM' : 'AM',
      })
    }

    publish('esp32s3/settime', timeInput, { qos: 1 })
    notifyAction(`Hora RTC enviada: ${timeInput}`)
  }

  // Sincronizar RTC con el reloj local de la computadora/dispositivo
  const syncWithDeviceTime = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const localTime = `${hh}:${mm}`
    setTimeInput(localTime)

    setTimeRTC?.({
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM',
    })

    publish('esp32s3/settime', localTime, { qos: 1 })
    notifyAction(`Hora sincronizada con dispositivo: ${localTime}`)
  }

  // Cambio de temperatura con validación
  const sendTempToDisplay = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    if (localTemp === '' || localTemp === null) return
    const num = Number(localTemp)
    if (isNaN(num) || num < 10 || num > 60) {
      notifyAction('La temperatura debe estar entre 10°C y 60°C')
      return
    }

    setTemp?.(String(localTemp))
    publish('esp32s3/settemp', String(localTemp), { qos: 1 })
    notifyAction(`Temperatura configurada: ${localTemp}°C`)
  }

  // Selector de Color
  const handleTextColorChange = (color) => {
    setTextColor(color)
    onColorChange?.(color)

    if (isReadOnly) {
      notifyAction('Color actualizado en pantalla virtual local (Modo Espectador)')
      return
    }

    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current)
    }
    colorDebounceRef.current = setTimeout(() => {
      publish('esp32s3/setcolor', color, { qos: 1 })
    }, 150)
  }

  // Cambio instantáneo de modo de pantalla
  const handleScreenType = (type) => {
    onScreenChange?.(type)
    if (!isReadOnly) {
      publish('esp32s3/screen_type', type, { qos: 1 })
    }
    notifyAction(`Pantalla cambiada a modo ${type === 'chrono' ? 'CRONÓMETRO' : 'VISUALIZACIÓN'}`)
  }

  // Construcción de la lista de nadadores con cálculo de tiempo en vivo si están corriendo
  const swimmersList = useMemo(() => {
    return (userData || []).map((user) => {
      const isRunning = String(runningSwimmerId) === String(user.id)
      const userScore = scores?.find((s) => String(s.id) === String(user.id))

      let timeFormatted = '00:00:00.00'

      if (isRunning) {
        if (timeChrono?.id && String(timeChrono.id) === String(user.id)) {
          const hh = String(timeChrono.hh ?? 0).padStart(2, '0')
          const mm = String(timeChrono.mm ?? 0).padStart(2, '0')
          const ss = String(timeChrono.ss ?? 0).padStart(2, '0')
          const ms = String(timeChrono.ms ?? 0).padStart(2, '0')
          timeFormatted = `${hh}:${mm}:${ss}.${ms}`
        } else {
          timeFormatted = '00:00:00.00'
        }
      } else if (userScore) {
        const hh = String(userScore.hh ?? 0).padStart(2, '0')
        const mm = String(userScore.mm ?? 0).padStart(2, '0')
        const ss = String(userScore.ss ?? 0).padStart(2, '0')
        const ms = String(userScore.ms ?? 0).padStart(2, '0')
        timeFormatted = `${hh}:${mm}:${ss}.${ms}`
      }

      return {
        ...user,
        timeFormatted,
        hasScore: Boolean(userScore),
        isRunning,
      }
    })
  }, [userData, scores, runningSwimmerId, timeChrono])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Notificación flotante de confirmación de acción */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xs font-mono text-xs animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Banner de Modo Espectador */}
      {isReadOnly && (
        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-cyan-200 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Modo Espectador Activo</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  Solo Lectura
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/80 mt-0.5">
                Visualizando tiempos y pantalla en tiempo real. Abre ajustes ⚙️ para acceder como Operador y controlar la competencia.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium shadow-md transition-all active:scale-95 shrink-0"
          >
            <Lock size={13} />
            <span>Acceso Operador</span>
          </button>
        </div>
      )}

      {/* Grid principal responsive */}
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
                {isHardwareOnline && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado
                  </span>
                )}
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
                    const isRunning = swimmer.isRunning
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
                              onClick={() => {
                                if (isReadOnly) {
                                  notifyReadOnly()
                                } else {
                                  setConfirmDeleteId(swimmer.id)
                                }
                              }}
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
                        const isRunning = swimmer.isRunning
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
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
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
                                    onClick={() => {
                                      if (isReadOnly) {
                                        notifyReadOnly()
                                      } else {
                                        setConfirmDeleteId(swimmer.id)
                                      }
                                    }}
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
                  Siguiente ID: #{(userData || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1}
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
                  id="swimmer-nombre"
                  name="nombre"
                  autoComplete="given-name"
                  placeholder="Nombre *"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                  aria-label="Nombre del nadador"
                />
                <input
                  type="text"
                  id="swimmer-apellido"
                  name="apellido"
                  autoComplete="family-name"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                  aria-label="Apellido del nadador"
                />
                <input
                  type="number"
                  id="swimmer-edad"
                  name="edad"
                  autoComplete="off"
                  placeholder="Edad"
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                  aria-label="Edad del nadador"
                />
                <input
                  type="text"
                  id="swimmer-cedula"
                  name="cedula"
                  autoComplete="off"
                  placeholder="Cédula / DNI *"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="bg-gray-850 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
                  aria-label="Cédula o DNI del nadador"
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
                id="rtc-time-input"
                name="rtcTime"
                aria-label="Ajustar hora RTC"
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
                id="temperature-input"
                name="temperature"
                aria-label="Ajustar temperatura ambiente"
                min="10"
                max="60"
                value={localTemp}
                onChange={(e) => setLocalTemp(e.target.value)}
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