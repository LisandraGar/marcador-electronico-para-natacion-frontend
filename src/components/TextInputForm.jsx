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
  Palette,
  Sliders,
  ChevronDown,
  ChevronUp,
  Square
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
  isConnected = false,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  // Asignación de Carril 1 y Carril 2 para los 2 nadadores en simultáneo
  const [lane1Id, setLane1Id] = useState('')
  const [lane2Id, setLane2Id] = useState('')

  // Paneles secundarios ocultos por defecto para mantener una vista limpia y armoniosa
  const [isAddSwimmerOpen, setIsAddSwimmerOpen] = useState(false)
  const [isHardwareSettingsOpen, setIsHardwareSettingsOpen] = useState(false)
  const [activeHardwareTab, setActiveHardwareTab] = useState('color') // 'color' | 'rtc' | 'temp'

  const colorDebounceRef = useRef(null)

  useEffect(() => {
    if (temp !== undefined && temp !== null && temp !== '') {
      setLocalTemp(temp)
    }
  }, [temp])

  // Sincronizar selección de carriles cuando cambia la lista de nadadores
  useEffect(() => {
    if (userData && userData.length > 0) {
      setLane1Id((prev) => {
        if (prev && userData.some((u) => String(u.id) === String(prev))) return prev
        return String(userData[0].id)
      })
      setLane2Id((prev) => {
        if (prev && userData.some((u) => String(u.id) === String(prev))) return prev
        return String(userData.length > 1 ? userData[1].id : userData[0].id)
      })
    }
  }, [userData])

  // Sincronizar automáticamente si el ESP32 o botón físico reporta un ID activo
  useEffect(() => {
    if (timeChrono?.c1?.id) {
      setLane1Id(String(timeChrono.c1.id))
    }
    if (timeChrono?.c2?.id) {
      setLane2Id(String(timeChrono.c2.id))
    }
  }, [timeChrono?.c1?.id, timeChrono?.c2?.id])

  const notifyAction = (text) => {
    setActionNotice(text)
    setTimeout(() => setActionNotice(null), 2600)
  }

  const notifyReadOnly = () => {
    notifyAction('⚠️ Modo Espectador: Haz clic en Espectador arriba para acceder como Operador.')
    onOpenSettings?.()
  }

  // Estados de ejecución en tiempo real para Carril 1 y Carril 2
  const isLane1Running = useMemo(() => {
    if (!lane1Id) return false
    if (timeChrono?.c1) {
      return String(timeChrono.c1.id) === String(lane1Id) && timeChrono.c1.status === 'started'
    }
    return String(timeChrono?.id) === String(lane1Id) && timeChrono?.status === 'started'
  }, [timeChrono, lane1Id])

  const isLane2Running = useMemo(() => {
    if (!lane2Id) return false
    if (timeChrono?.c2) {
      return String(timeChrono.c2.id) === String(lane2Id) && timeChrono.c2.status === 'started'
    }
    return false
  }, [timeChrono, lane2Id])

  const isAnyRunning = useMemo(() => {
    return Boolean(
      isLane1Running ||
      isLane2Running ||
      timeChrono?.both_running ||
      timeChrono?.status === 'started' ||
      (timeChrono?.active_count && timeChrono.active_count > 0)
    )
  }, [isLane1Running, isLane2Running, timeChrono])

  // Tiempos formateados para Carril 1 y Carril 2
  const lane1Score = useMemo(() => {
    return scores?.find((s) => String(s.id) === String(lane1Id))
  }, [scores, lane1Id])

  const lane2Score = useMemo(() => {
    return scores?.find((s) => String(s.id) === String(lane2Id))
  }, [scores, lane2Id])

  const lane1Time = useMemo(() => {
    if (isLane1Running) {
      const tc = timeChrono?.c1 || timeChrono
      const hh = String(tc?.hh ?? 0).padStart(2, '0')
      const mm = String(tc?.mm ?? 0).padStart(2, '0')
      const ss = String(tc?.ss ?? 0).padStart(2, '0')
      const ms = String(tc?.ms ?? 0).padStart(2, '0')
      return `${hh}:${mm}:${ss}.${ms}`
    }
    if (lane1Score) {
      const hh = String(lane1Score.hh ?? 0).padStart(2, '0')
      const mm = String(lane1Score.mm ?? 0).padStart(2, '0')
      const ss = String(lane1Score.ss ?? 0).padStart(2, '0')
      const ms = String(lane1Score.ms ?? 0).padStart(2, '0')
      return `${hh}:${mm}:${ss}.${ms}`
    }
    return '00:00:00.00'
  }, [isLane1Running, timeChrono, lane1Score])

  const lane2Time = useMemo(() => {
    if (isLane2Running) {
      const tc = timeChrono?.c2
      const hh = String(tc?.hh ?? 0).padStart(2, '0')
      const mm = String(tc?.mm ?? 0).padStart(2, '0')
      const ss = String(tc?.ss ?? 0).padStart(2, '0')
      const ms = String(tc?.ms ?? 0).padStart(2, '0')
      return `${hh}:${mm}:${ss}.${ms}`
    }
    if (lane2Score) {
      const hh = String(lane2Score.hh ?? 0).padStart(2, '0')
      const mm = String(lane2Score.mm ?? 0).padStart(2, '0')
      const ss = String(lane2Score.ss ?? 0).padStart(2, '0')
      const ms = String(lane2Score.ms ?? 0).padStart(2, '0')
      return `${hh}:${mm}:${ss}.${ms}`
    }
    return '00:00:00.00'
  }, [isLane2Running, timeChrono, lane2Score])

  // Formato exacto para la matriz LED virtual (espejo de la matriz física en modos 'chrono' y 'show')
  const formatMatrixText = useCallback(
    (h, m, ampm, t, tc, tr, scr) => {
      const t_hh = String(h ?? 0).padStart(2, '0')
      const t_mm = String(m ?? 0).padStart(2, '0')

      const netBadge = isConnected ? '[ON]' : '[L]'

      // Modo Cronómetros: muestra siempre los 2 cronómetros en simultáneo igual que la pantalla física
      if (scr === 'chrono') {
        const c1Source = (tc?.c1 && String(tc.c1.id) === String(lane1Id || tc.c1.id)) ? tc.c1 : (lane1Score || tc?.c1 || tc)
        const c2Source = (tc?.c2 && String(tc.c2.id) === String(lane2Id || tc.c2.id)) ? tc.c2 : (lane2Score || tc?.c2)

        const id1 = tc?.c1?.id || lane1Id || '1'
        const c1_hh = String(c1Source?.hh ?? 0).padStart(2, '0')
        const c1_mm = String(c1Source?.mm ?? 0).padStart(2, '0')
        const c1_ss = String(c1Source?.ss ?? 0).padStart(2, '0')
        const c1_ms = String(c1Source?.ms ?? 0).padStart(2, '0')

        const id2 = tc?.c2?.id || lane2Id || '2'
        const c2_hh = String(c2Source?.hh ?? 0).padStart(2, '0')
        const c2_mm = String(c2Source?.mm ?? 0).padStart(2, '0')
        const c2_ss = String(c2Source?.ss ?? 0).padStart(2, '0')
        const c2_ms = String(c2Source?.ms ?? 0).padStart(2, '0')

        return ` ${t_hh}:${t_mm} ${ampm} ${t}°C ${netBadge}\nC1: ${c1_hh}:${c1_mm}:${c1_ss}.${c1_ms}\nC2: ${c2_hh}:${c2_mm}:${c2_ss}.${c2_ms}`
      }

      // Modo Récords ('show'): muestra los récords igual que la pantalla física
      const validViewRecords = Array.isArray(tr)
        ? tr.filter((r) => r && r.id !== '' && r.id !== null && r.id !== undefined)
        : []
      const activeRecords =
        validViewRecords.length > 0 ? validViewRecords : (scores || []).slice(0, 2)

      const tr0 = activeRecords[0]
      const tr1 = activeRecords[1]

      const tr0_str = tr0
        ? `RECORDS ${tr0.id}.${String(tr0.hh ?? 0).padStart(2, '0')}:${String(tr0.mm ?? 0).padStart(2, '0')}:${String(tr0.ss ?? 0).padStart(2, '0')}.${String(tr0.ms ?? 0).padStart(2, '0')}`
        : 'RECORDS'

      const tr1_str = tr1
        ? `${tr1.id}.${String(tr1.hh ?? 0).padStart(2, '0')}:${String(tr1.mm ?? 0).padStart(2, '0')}:${String(tr1.ss ?? 0).padStart(2, '0')}.${String(tr1.ms ?? 0).padStart(2, '0')}`
        : ''

      return `${t_hh}:${t_mm} ${ampm}  HEAT ${t} ${netBadge}\n${tr0_str}\n        ${tr1_str}`
    },
    [scores, lane1Id, lane2Id, lane1Score, lane2Score, isConnected]
  )

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

  // ========================================================
  // LOS 4 BOTONES DEL SISTEMA (FÍSICOS Y VIRTUALES):
  // 1. Cambiar visualización (Récords <-> Cronómetros)
  // 2. Inicio y pausa global (Ambos nadadores)
  // 3. Inicio y pausa 1 (Carril 1)
  // 4. Inicio y pausa 2 (Carril 2)
  // ========================================================

  // BOTÓN 1: Cambiar visualización ('show' <-> 'chrono')
  const handleToggleScreenMode = () => {
    const nextType = currentScreen === 'chrono' ? 'show' : 'chrono'
    onScreenChange?.(nextType)
    if (!isReadOnly) {
      publish('esp32s3/screen_type', nextType, { qos: 1 })
    }
    notifyAction(
      `Vista cambiada a: ${nextType === 'chrono' ? 'CRONÓMETROS' : 'RÉCORDS'}`
    )
  }

  // BOTÓN 2: Inicio y Pausa Global (Ambos cronómetros)
  const handleGlobalToggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    const id1 = lane1Id || '1'
    const id2 = lane2Id || '2'

    if (isAnyRunning) {
      publish('esp32s3/chrono', 'stop_all', { qos: 1 })
      notifyAction('⏹ Parada Global: Ambos cronómetros detenidos')
    } else {
      setScores?.((prev) =>
        prev.filter((s) => String(s.id) !== String(id1) && String(s.id) !== String(id2))
      )
      publish('esp32s3/chrono', `start_all:${id1},${id2}`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`🚀 Inicio Global: Carril 1 (#${id1}) y Carril 2 (#${id2})`)
    }
  }

  // BOTÓN 3: Inicio y Pausa 1 (Carril 1)
  const handleLane1Toggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    const id1 = lane1Id || '1'

    if (isLane1Running) {
      publish('esp32s3/chrono', `pause_chrono:${id1}`, { qos: 1 })
      notifyAction(`⏹ Pausa 1: Carril 1 detenido (#${id1})`)
    } else {
      setScores?.((prev) => prev.filter((s) => String(s.id) !== String(id1)))
      publish('esp32s3/chrono', `play_chrono:${id1}:1`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`▶️ Inicio 1: Carril 1 en marcha (#${id1})`)
    }
  }

  // BOTÓN 4: Inicio y Pausa 2 (Carril 2)
  const handleLane2Toggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    const id2 = lane2Id || '2'

    if (isLane2Running) {
      publish('esp32s3/chrono', `pause_chrono:${id2}`, { qos: 1 })
      notifyAction(`⏹ Pausa 2: Carril 2 detenido (#${id2})`)
    } else {
      setScores?.((prev) => prev.filter((s) => String(s.id) !== String(id2)))
      publish('esp32s3/chrono', `play_chrono:${id2}:2`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`▶️ Inicio 2: Carril 2 en marcha (#${id2})`)
    }
  }

  // Reiniciar récord de un nadador
  const handleResetScore = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)
    setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))
    publish('esp32s3/del_score', swimmerIdStr, { qos: 1 })

    setTimeout(() => {
      publish('esp32s3/get_users', 'get_users', { qos: 1 })
    }, 250)

    notifyAction(`Tiempo reiniciado para nadador #${id}`)
  }

  // Eliminar nadador
  const handleDeleteUser = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)
    setUserData?.((prev) => prev.filter((u) => String(u.id) !== swimmerIdStr))
    setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))
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
    setIsAddSwimmerOpen(false)
    notifyAction(`Nadador ${payload.nombre} registrado`)
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
    notifyAction(`Hora actualizada: ${timeInput}`)
  }

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
    notifyAction(`Hora sincronizada: ${localTime}`)
  }

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
    notifyAction(`Temperatura establecida: ${localTemp}°C`)
  }

  const handleTextColorChange = (color) => {
    setTextColor(color)
    onColorChange?.(color)

    if (isReadOnly) {
      return
    }

    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current)
    }
    colorDebounceRef.current = setTimeout(() => {
      publish('esp32s3/setcolor', color, { qos: 1 })
    }, 150)
  }

  // Lista de nadadores con sus récords y carriles
  const swimmersList = useMemo(() => {
    return (userData || []).map((user) => {
      const uId = String(user.id)
      const isC1 = timeChrono?.c1 && String(timeChrono.c1.id) === uId && timeChrono.c1.status === 'started'
      const isC2 = timeChrono?.c2 && String(timeChrono.c2.id) === uId && timeChrono.c2.status === 'started'
      const isRunning = Boolean(isC1 || isC2)
      const userScore = scores?.find((s) => String(s.id) === uId)

      let laneBadge = null
      if (String(lane1Id) === uId) laneBadge = 'Carril 1'
      else if (String(lane2Id) === uId) laneBadge = 'Carril 2'

      let timeFormatted = '00:00:00.00'

      if (isRunning) {
        const tc = isC2 ? timeChrono.c2 : (timeChrono?.c1 || timeChrono)
        const hh = String(tc?.hh ?? 0).padStart(2, '0')
        const mm = String(tc?.mm ?? 0).padStart(2, '0')
        const ss = String(tc?.ss ?? 0).padStart(2, '0')
        const ms = String(tc?.ms ?? 0).padStart(2, '0')
        timeFormatted = `${hh}:${mm}:${ss}.${ms}`
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
        laneBadge,
      }
    })
  }, [userData, scores, timeChrono, lane1Id, lane2Id])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Notificación flotante */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-950/95 text-emerald-300 border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xs font-mono text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ========================================================
          PANEL DE CONTROL PRINCIPAL (LOS 4 BOTONES Y 2 CRONÓMETROS)
      ======================================================== */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Barra Superior con Botón 1 (Cambiar Visualización) y Botón 2 (Inicio/Pausa Global) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <Timer className="text-emerald-400" size={20} />
            <div>
              <h2 className="text-sm font-bold font-mono text-gray-100 uppercase tracking-wider">
                Control de Cronómetros y Pantalla
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                Vista activa en pantalla:{' '}
                <strong className="text-emerald-400">
                  {currentScreen === 'chrono' ? 'CRONÓMETROS' : 'RÉCORDS'}
                </strong>
              </p>
            </div>
          </div>

          {/* Botonera Maestra: Botón 1 y Botón 2 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* BOTÓN 1: Cambiar visualización */}
            <button
              type="button"
              onClick={handleToggleScreenMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Alternar entre vista de Récords y vista de Cronómetros"
            >
              <Monitor size={14} className="text-cyan-400" />
              <span>
                1. Cambiar Visualización ({currentScreen === 'chrono' ? 'Ver Récords' : 'Ver Cronómetros'})
              </span>
            </button>

            {/* BOTÓN 2: Inicio y Pausa Global */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleGlobalToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isAnyRunning
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400/40 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                }`}
              >
                {isAnyRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>
                  2. {isAnyRunning ? 'Pausa Global' : 'Inicio Global'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Los 2 Cronómetros en Simultáneo: Carril 1 (Botón 3) y Carril 2 (Botón 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARRIL 1 + BOTÓN 3 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLane1Running
                ? 'bg-emerald-950/20 border-emerald-500/50'
                : 'bg-gray-950/60 border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  CRONÓMETRO 1
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {isLane1Running ? '● En carrera' : lane1Score ? '✓ Registrado' : 'En espera'}
                </span>
              </div>

              {!isReadOnly && lane1Id && (
                <button
                  type="button"
                  onClick={() => handleResetScore(lane1Id)}
                  className="p-1 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Reiniciar tiempo de Carril 1"
                >
                  <RotateCw size={13} />
                </button>
              )}
            </div>

            <div className="mb-3">
              <select
                id="lane1-select"
                aria-label="Nadador Carril 1"
                value={lane1Id}
                disabled={isReadOnly || isLane1Running}
                onChange={(e) => setLane1Id(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
              >
                {userData.length === 0 && <option value="1">Nadador #01</option>}
                {userData.map((user) => (
                  <option key={user.cedula || user.id} value={user.id}>
                    #{String(user.id).padStart(2, '0')} — {user.nombre} {user.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 flex-1 text-center">
                <span
                  className={`text-2xl font-mono font-bold tracking-wider ${
                    isLane1Running ? 'text-emerald-400 animate-pulse' : 'text-gray-100'
                  }`}
                >
                  {lane1Time}
                </span>
              </div>

              {/* BOTÓN 3: Inicio y Pausa 1 */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleLane1Toggle}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
                    isLane1Running
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isLane1Running ? <Pause size={14} /> : <Play size={14} />}
                  <span>3. {isLane1Running ? 'Pausa 1' : 'Inicio 1'}</span>
                </button>
              )}
            </div>
          </div>

          {/* CARRIL 2 + BOTÓN 4 */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLane2Running
                ? 'bg-cyan-950/20 border-cyan-500/50'
                : 'bg-gray-950/60 border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  CRONÓMETRO 2
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {isLane2Running ? '● En carrera' : lane2Score ? '✓ Registrado' : 'En espera'}
                </span>
              </div>

              {!isReadOnly && lane2Id && (
                <button
                  type="button"
                  onClick={() => handleResetScore(lane2Id)}
                  className="p-1 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Reiniciar tiempo de Carril 2"
                >
                  <RotateCw size={13} />
                </button>
              )}
            </div>

            <div className="mb-3">
              <select
                id="lane2-select"
                aria-label="Nadador Carril 2"
                value={lane2Id}
                disabled={isReadOnly || isLane2Running}
                onChange={(e) => setLane2Id(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-100 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
              >
                {userData.length === 0 && <option value="2">Nadador #02</option>}
                {userData.map((user) => (
                  <option key={user.cedula || user.id} value={user.id}>
                    #{String(user.id).padStart(2, '0')} — {user.nombre} {user.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 flex-1 text-center">
                <span
                  className={`text-2xl font-mono font-bold tracking-wider ${
                    isLane2Running ? 'text-cyan-400 animate-pulse' : 'text-gray-100'
                  }`}
                >
                  {lane2Time}
                </span>
              </div>

              {/* BOTÓN 4: Inicio y Pausa 2 */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleLane2Toggle}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
                    isLane2Running
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isLane2Running ? <Pause size={14} /> : <Play size={14} />}
                  <span>4. {isLane2Running ? 'Pausa 2' : 'Inicio 2'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          TABLA DE NADADORES Y RÉCORDS (CON PANELES SECUNDARIOS OCULTOS)
      ======================================================== */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={18} />
            <h3 className="text-sm font-bold font-mono text-gray-200 uppercase tracking-wider">
              Nadadores y Récords
            </h3>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {swimmersList.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setIsAddSwimmerOpen(!isAddSwimmerOpen)
                  if (!isAddSwimmerOpen) setIsHardwareSettingsOpen(false)
                }}
                className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isAddSwimmerOpen
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'
                }`}
              >
                <UserPlus size={13} />
                <span>{isAddSwimmerOpen ? 'Cerrar Registro' : '＋ Nadador'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsHardwareSettingsOpen(!isHardwareSettingsOpen)
                if (!isHardwareSettingsOpen) setIsAddSwimmerOpen(false)
              }}
              className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isHardwareSettingsOpen
                  ? 'bg-gray-700 text-emerald-300 border-emerald-500/40'
                  : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700'
              }`}
            >
              <Sliders size={13} />
              <span>Ajustes Display</span>
              {isHardwareSettingsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Panel desplegable 1: Registrar Nuevo Nadador (Oculto por defecto) */}
        {!isReadOnly && isAddSwimmerOpen && (
          <form
            onSubmit={handleAddUser}
            className="p-3.5 bg-gray-950 border border-emerald-500/30 rounded-xl space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono uppercase text-gray-300 font-bold">
              <span>Registrar Nuevo Nadador</span>
              <span className="text-[10px] text-gray-500 font-normal">
                ID: #{(userData || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1}
              </span>
            </div>

            {formError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg font-mono">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                type="text"
                name="nombre"
                placeholder="Nombre *"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                name="apellido"
                placeholder="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                name="edad"
                placeholder="Edad"
                value={formData.edad}
                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                name="cedula"
                placeholder="Cédula *"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddSwimmerOpen(false)}
                className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white bg-gray-900 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        {/* Panel desplegable 2: Ajustes de Color, Hora RTC y Temperatura (Oculto por defecto) */}
        {isHardwareSettingsOpen && (
          <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
            {isReadOnly ? (
              <ColorPicker
                color={textColor}
                onColorChange={handleTextColorChange}
                className="bg-transparent border-0 p-0"
              />
            ) : (
              <>
                <div className="flex rounded-xl bg-gray-900 p-1 border border-gray-800 max-w-md">
                  <button
                    type="button"
                    onClick={() => setActiveHardwareTab('color')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      activeHardwareTab === 'color'
                        ? 'bg-gray-800 text-emerald-300 border border-gray-700'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Palette size={13} />
                    <span>Color LED</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHardwareTab('rtc')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      activeHardwareTab === 'rtc'
                        ? 'bg-gray-800 text-emerald-300 border border-gray-700'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Clock size={13} />
                    <span>Hora RTC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHardwareTab('temp')}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      activeHardwareTab === 'temp'
                        ? 'bg-gray-800 text-emerald-300 border border-gray-700'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Thermometer size={13} />
                    <span>Temperatura</span>
                  </button>
                </div>

                {activeHardwareTab === 'color' && (
                  <ColorPicker
                    color={textColor}
                    onColorChange={handleTextColorChange}
                    className="bg-transparent border-0 p-0"
                  />
                )}

                {activeHardwareTab === 'rtc' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="time"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={sendTimeToRTC}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-lg cursor-pointer"
                    >
                      Enviar Hora
                    </button>
                    <button
                      type="button"
                      onClick={syncWithDeviceTime}
                      className="px-3 py-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg cursor-pointer"
                    >
                      Sincronizar con PC
                    </button>
                  </div>
                )}

                {activeHardwareTab === 'temp' && (
                  <div className="flex items-center gap-2 pt-1 max-w-xs">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={localTemp}
                      onChange={(e) => setLocalTemp(e.target.value)}
                      className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={sendTempToDisplay}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-lg cursor-pointer"
                    >
                      Actualizar °C
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Listado limpio de Nadadores y Récords */}
        {swimmersList.length === 0 ? (
          <div className="py-6 text-center text-gray-400 font-mono text-xs border border-dashed border-gray-800 rounded-xl bg-gray-950/40">
            No hay nadadores registrados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/60">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-gray-800/70 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Nadador</th>
                  <th className="py-2.5 px-3">Carril</th>
                  <th className="py-2.5 px-3">Récord / Tiempo</th>
                  <th className="py-2.5 px-3 text-center">{isReadOnly ? 'Estado' : 'Acciones'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {swimmersList.map((swimmer) => {
                  const isRunning = swimmer.isRunning
                  return (
                    <tr
                      key={swimmer.cedula || swimmer.id}
                      className={isRunning ? 'bg-emerald-950/20' : 'hover:bg-gray-900/50'}
                    >
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        #{String(swimmer.id).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 text-gray-200">
                        {swimmer.nombre} {swimmer.apellido}
                      </td>
                      <td className="py-2.5 px-3">
                        {swimmer.laneBadge ? (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              swimmer.laneBadge === 'Carril 1'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {swimmer.laneBadge}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            isRunning
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                              : swimmer.hasScore
                              ? 'text-emerald-300'
                              : 'text-gray-400'
                          }`}
                        >
                          {swimmer.timeFormatted}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isReadOnly ? (
                          <span className="text-[10px] text-gray-400">
                            {isRunning ? 'En carrera' : swimmer.hasScore ? 'Registrado' : 'En espera'}
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResetScore(swimmer.id)}
                              className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 transition-colors cursor-pointer"
                              title="Reiniciar récord"
                            >
                              <RotateCw size={13} />
                            </button>

                            {confirmDeleteId === swimmer.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(swimmer.id)}
                                  className="px-2 py-1 bg-red-600 text-white text-[10px] rounded cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-gray-700 text-gray-300 text-[10px] rounded cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(swimmer.id)}
                                className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-red-400 border border-gray-700 transition-colors cursor-pointer"
                                title="Eliminar nadador"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}