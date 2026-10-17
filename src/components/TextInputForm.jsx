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
  Lock,
  Palette,
  Sliders,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
  Square,
  Zap,
  Flag
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

  // Asignación de Carril 1 y Carril 2 para 2 nadadores en simultáneo
  const [lane1Id, setLane1Id] = useState('')
  const [lane2Id, setLane2Id] = useState('')

  // Estados de organización UI
  const [isAddSwimmerOpen, setIsAddSwimmerOpen] = useState(false)
  const [activeHardwareTab, setActiveHardwareTab] = useState('color') // 'color' | 'rtc' | 'temp'

  const colorDebounceRef = useRef(null)

  // Sincronizar input de temperatura cuando el microcontrolador envía nueva medición
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

  // Sincronizar automáticamente si el microcontrolador o sensor físico reporta un ID activo
  useEffect(() => {
    if (timeChrono?.c1?.id) {
      setLane1Id(String(timeChrono.c1.id))
    }
    if (timeChrono?.c2?.id) {
      setLane2Id(String(timeChrono.c2.id))
    }
  }, [timeChrono?.c1?.id, timeChrono?.c2?.id])

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

  // Centraliza el formato de texto para la matriz LED virtual (compatible con 1 y 2 nadadores)
  const formatMatrixText = useCallback(
    (h, m, ampm, t, tc, tr, scr) => {
      const activeRecords = (scores && scores.length <= 2 && scores.length > 0) ? scores : (tr || [])

      const t_hh = String(h ?? 0).padStart(2, '0')
      const t_mm = String(m ?? 0).padStart(2, '0')

      if (scr === 'chrono') {
        const c1 = tc?.c1 || tc
        const c2 = tc?.c2

        // Si hay información de segundo carril, renderizar las 3 líneas con ambos carriles
        if (c2 && (c2.status === 'started' || c2.id)) {
          const c1_hh = String(c1?.hh ?? 0).padStart(2, '0')
          const c1_mm = String(c1?.mm ?? 0).padStart(2, '0')
          const c1_ss = String(c1?.ss ?? 0).padStart(2, '0')
          const c1_ms = String(c1?.ms ?? 0).padStart(2, '0')

          const c2_hh = String(c2?.hh ?? 0).padStart(2, '0')
          const c2_mm = String(c2?.mm ?? 0).padStart(2, '0')
          const c2_ss = String(c2?.ss ?? 0).padStart(2, '0')
          const c2_ms = String(c2?.ms ?? 0).padStart(2, '0')

          return `   ${t_hh}:${t_mm} ${ampm} - ${t}°C   \n1|#${c1?.id ?? '1'} ${c1_hh}:${c1_mm}:${c1_ss}.${c1_ms}\n2|#${c2?.id ?? '2'} ${c2_hh}:${c2_mm}:${c2_ss}.${c2_ms}`
        }

        const c_hh = String(tc?.hh ?? 0).padStart(2, '0')
        const c_mm = String(tc?.mm ?? 0).padStart(2, '0')
        const c_ss = String(tc?.ss ?? 0).padStart(2, '0')
        const c_ms = String(tc?.ms ?? 0).padStart(2, '0')
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
      currentScreen,
      formatMatrixText
    )
    onTextSubmit(formatted)
  }, [timeRTC, timeChrono, temp, twoRecords, currentScreen, formatMatrixText, onTextSubmit])

  // Detectar si el cronómetro activo fue detenido externamente (sensor táctil o ESP32)
  useEffect(() => {
    if (runningSwimmerId && scores && scores.length > 0) {
      const swimmerHasFinished = scores.some((s) => String(s.id) === String(runningSwimmerId))
      if (swimmerHasFinished) {
        setRunningSwimmerId(null)
      }
    }
  }, [scores, runningSwimmerId])

  // ========================================================
  // LOS 3 BOTONES DE CONTROL DE CRONÓMETRO:
  // 1. Iniciar/Pausar Carril 1 individualmente
  // 2. Iniciar/Pausar Carril 2 individualmente
  // 3. Iniciar/Pausar Global simultáneo para ambos nadadores
  // ========================================================

  // BOTÓN 1: Iniciar / Pausar Carril 1
  const handleLane1Toggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    if (!lane1Id) {
      notifyAction('⚠️ Selecciona un nadador para el Carril 1')
      return
    }

    if (isLane1Running) {
      publish('esp32s3/chrono', `pause_chrono:${lane1Id}`, { qos: 1 })
      notifyAction(`⏹ Carril 1 detenido (Nadador #${lane1Id})`)
    } else {
      setScores?.((prev) => prev.filter((s) => String(s.id) !== String(lane1Id)))
      publish('esp32s3/chrono', `play_chrono:${lane1Id}:1`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`▶️ Carril 1 iniciado (Nadador #${lane1Id})`)
    }
  }

  // BOTÓN 2: Iniciar / Pausar Carril 2
  const handleLane2Toggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    if (!lane2Id) {
      notifyAction('⚠️ Selecciona un nadador para el Carril 2')
      return
    }

    if (isLane2Running) {
      publish('esp32s3/chrono', `pause_chrono:${lane2Id}`, { qos: 1 })
      notifyAction(`⏹ Carril 2 detenido (Nadador #${lane2Id})`)
    } else {
      setScores?.((prev) => prev.filter((s) => String(s.id) !== String(lane2Id)))
      publish('esp32s3/chrono', `play_chrono:${lane2Id}:2`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`▶️ Carril 2 iniciado (Nadador #${lane2Id})`)
    }
  }

  // BOTÓN 3: Iniciar Salida Global Simultánea / Parada Global
  const handleGlobalToggle = () => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }
    if (!lane1Id || !lane2Id) {
      notifyAction('⚠️ Configura ambos carriles para la salida global')
      return
    }

    if (isAnyRunning) {
      publish('esp32s3/chrono', 'stop_all', { qos: 1 })
      notifyAction('⏹ Parada Global: Ambos carriles detenidos')
    } else {
      setScores?.((prev) =>
        prev.filter((s) => String(s.id) !== String(lane1Id) && String(s.id) !== String(lane2Id))
      )
      publish('esp32s3/chrono', `start_all:${lane1Id},${lane2Id}`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`🚀 Salida Global: Carril 1 (#${lane1Id}) y Carril 2 (#${lane2Id})`)
    }
  }

  // Control individual por fila en la tabla de nadadores
  const handleChronoToggle = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)
    const isC1 = timeChrono?.c1 && String(timeChrono.c1.id) === swimmerIdStr && timeChrono.c1.status === 'started'
    const isC2 = timeChrono?.c2 && String(timeChrono.c2.id) === swimmerIdStr && timeChrono.c2.status === 'started'
    const isCurrentlyRunning = isC1 || isC2 || (String(timeChrono?.id) === swimmerIdStr && timeChrono?.status === 'started')

    if (isCurrentlyRunning) {
      publish('esp32s3/chrono', `pause_chrono:${swimmerIdStr}`, { qos: 1 })
      notifyAction(`⏹ Pausado cronómetro #${id}`)
    } else {
      // Si el nadador está en Carril 2, usar carril 2, de lo contrario carril 1
      const slot = String(lane2Id) === swimmerIdStr ? 2 : 1
      if (slot === 1) setLane1Id(swimmerIdStr)
      else setLane2Id(swimmerIdStr)

      setScores?.((prev) => prev.filter((s) => String(s.id) !== swimmerIdStr))
      publish('esp32s3/chrono', `play_chrono:${swimmerIdStr}:${slot}`, { qos: 1 })
      if (currentScreen !== 'chrono') {
        publish('esp32s3/screen_type', 'chrono', { qos: 1 })
        onScreenChange?.('chrono')
      }
      notifyAction(`▶️ Iniciado cronómetro para nadador #${id} (Carril ${slot})`)
    }
  }

  // Reiniciar score/tiempo de un nadador
  const handleResetScore = (id) => {
    if (isReadOnly) {
      notifyReadOnly()
      return
    }

    const swimmerIdStr = String(id)
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
    setIsAddSwimmerOpen(false)
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

  // Sincronizar RTC con el reloj local de la computadora
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
      notifyAction('Color actualizado en pantalla virtual local')
      return
    }

    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current)
    }
    colorDebounceRef.current = setTimeout(() => {
      publish('esp32s3/setcolor', color, { qos: 1 })
    }, 150)
  }

  // Cambio de modo de pantalla
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
      const uId = String(user.id)
      const isC1 = timeChrono?.c1 && String(timeChrono.c1.id) === uId && timeChrono.c1.status === 'started'
      const isC2 = timeChrono?.c2 && String(timeChrono.c2.id) === uId && timeChrono.c2.status === 'started'
      const isLegacyRunning = String(runningSwimmerId) === uId || (String(timeChrono?.id) === uId && timeChrono?.status === 'started')

      const isRunning = Boolean(isC1 || isC2 || isLegacyRunning)
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
  }, [userData, scores, runningSwimmerId, timeChrono, lane1Id, lane2Id])

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Notificación flotante de confirmación de acción */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-950/95 text-emerald-300 border border-emerald-500/50 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-xs font-mono text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Banner de Modo Espectador (Sutil y elegante) */}
      {isReadOnly && (
        <div className="bg-cyan-950/30 border border-cyan-500/25 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono text-cyan-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Eye size={15} />
            </span>
            <div>
              <span className="font-bold text-white">Transmisión Oficial en Vivo: </span>
              <span className="text-cyan-300/90">Estás en Modo Espectador recibiendo tiempos y récords en tiempo real.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-medium shadow transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Lock size={12} />
            <span>Acceso Operador</span>
          </button>
        </div>
      )}

      {/* ========================================================
          PANEL DE CONTROL DE SERIE (2 NADADORES EN SIMULTÁNEO)
          CON LOS 3 BOTONES:
          1. PARADA/INICIO CARRIL 1 (INDIVIDUAL)
          2. PARADA/INICIO CARRIL 2 (INDIVIDUAL)
          3. SALIDA/PARADA GLOBAL (AMBOS CARRILES)
      ======================================================== */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Cabecera del Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap size={18} />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-mono text-gray-100 uppercase tracking-wider flex items-center gap-2">
                <span>Control de Serie — 2 Nadadores en Simultáneo</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                  2 Carriles
                </span>
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                Lanzamiento sincronizado con microsegundos y parada individual por llegada
              </p>
            </div>
          </div>

          {/* BOTÓN 3: Control Global (Destacado en Cabecera / Centro) */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleGlobalToggle}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer ${
                isAnyRunning
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-950/50 border border-red-400/40 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/50 border border-emerald-400/40'
              }`}
            >
              {isAnyRunning ? <Square size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
              <span>{isAnyRunning ? '⏹ PARADA GLOBAL (Ambos Carriles)' : '🚀 SALIDA GLOBAL SIMULTÁNEA'}</span>
            </button>
          )}
        </div>

        {/* Grid de los 2 Carriles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ========================================================
              TARJETA CARRIL 1 (LANE 1) + BOTÓN 1
          ======================================================== */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLane1Running
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'bg-gray-900/80 border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  CARRIL 1
                </span>
                {isLane1Running ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    En Carrera
                  </span>
                ) : lane1Score ? (
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Llegada Registrada
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                    En Espera
                  </span>
                )}
              </div>

              {/* Reset rápido Carril 1 */}
              {!isReadOnly && lane1Id && (
                <button
                  type="button"
                  onClick={() => handleResetScore(lane1Id)}
                  className="p-1 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Reiniciar tiempo carril 1"
                >
                  <RotateCw size={13} />
                </button>
              )}
            </div>

            {/* Selector de Nadador para Carril 1 */}
            <div className="mb-3">
              <label htmlFor="lane1-select" className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                Nadador Asignado:
              </label>
              <select
                id="lane1-select"
                value={lane1Id}
                disabled={isReadOnly || isLane1Running}
                onChange={(e) => setLane1Id(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {userData.length === 0 && <option value="">Sin nadadores registrados</option>}
                {userData.map((user) => (
                  <option key={user.cedula || user.id} value={user.id}>
                    #{String(user.id).padStart(2, '0')} - {user.nombre} {user.apellido} (CI: {user.cedula})
                  </option>
                ))}
              </select>
            </div>

            {/* Display de Tiempo en Vivo Carril 1 */}
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                <Timer size={15} className={isLane1Running ? 'text-emerald-400 animate-spin' : 'text-gray-500'} />
                <span>Tiempo:</span>
              </div>
              <span className={`text-2xl font-mono font-bold tracking-wider ${isLane1Running ? 'text-emerald-400 animate-pulse' : 'text-gray-100'}`}>
                {lane1Time}
              </span>
            </div>

            {/* BOTÓN 1: Inicio / Parada Individual Carril 1 */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleLane1Toggle}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isLane1Running
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40'
                }`}
              >
                {isLane1Running ? <Pause size={14} /> : <Play size={14} />}
                <span>{isLane1Running ? 'Pausar Carril 1' : 'Iniciar Carril 1'}</span>
              </button>
            )}
          </div>

          {/* ========================================================
              TARJETA CARRIL 2 (LANE 2) + BOTÓN 2
          ======================================================== */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isLane2Running
                ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                : 'bg-gray-900/80 border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  CARRIL 2
                </span>
                {isLane2Running ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    En Carrera
                  </span>
                ) : lane2Score ? (
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    ✓ Llegada Registrada
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700">
                    En Espera
                  </span>
                )}
              </div>

              {/* Reset rápido Carril 2 */}
              {!isReadOnly && lane2Id && (
                <button
                  type="button"
                  onClick={() => handleResetScore(lane2Id)}
                  className="p-1 text-gray-500 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Reiniciar tiempo carril 2"
                >
                  <RotateCw size={13} />
                </button>
              )}
            </div>

            {/* Selector de Nadador para Carril 2 */}
            <div className="mb-3">
              <label htmlFor="lane2-select" className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                Nadador Asignado:
              </label>
              <select
                id="lane2-select"
                value={lane2Id}
                disabled={isReadOnly || isLane2Running}
                onChange={(e) => setLane2Id(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 focus:border-cyan-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {userData.length === 0 && <option value="">Sin nadadores registrados</option>}
                {userData.map((user) => (
                  <option key={user.cedula || user.id} value={user.id}>
                    #{String(user.id).padStart(2, '0')} - {user.nombre} {user.apellido} (CI: {user.cedula})
                  </option>
                ))}
              </select>
            </div>

            {/* Display de Tiempo en Vivo Carril 2 */}
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800/80 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                <Timer size={15} className={isLane2Running ? 'text-cyan-400 animate-spin' : 'text-gray-500'} />
                <span>Tiempo:</span>
              </div>
              <span className={`text-2xl font-mono font-bold tracking-wider ${isLane2Running ? 'text-cyan-400 animate-pulse' : 'text-gray-100'}`}>
                {lane2Time}
              </span>
            </div>

            {/* BOTÓN 2: Inicio / Parada Individual Carril 2 */}
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleLane2Toggle}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                  isLane2Running
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/40'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40'
                }`}
              >
                {isLane2Running ? <Pause size={14} /> : <Play size={14} />}
                <span>{isLane2Running ? 'Pausar Carril 2' : 'Iniciar Carril 2'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          GRID PRINCIPAL ORGANIZADO Y LIMPIO
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ========================================================
            COLUMNA IZQUIERDA: TABLA DE NADADORES Y TIEMPOS (7 cols)
        ======================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            {/* Cabecera de Nadadores */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold font-mono text-gray-200 uppercase tracking-wider">
                  Nadadores y Tiempos
                </h3>
                {isHardwareOnline && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ESP32 OK
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {swimmersList.length} {swimmersList.length === 1 ? 'Nadador' : 'Nadadores'}
                </span>

                {/* Botón para desplegar formulario de nuevo nadador (Solo Operadores) */}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsAddSwimmerOpen(!isAddSwimmerOpen)}
                    className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isAddSwimmerOpen
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-gray-800 text-gray-300 hover:text-white border-gray-700 hover:bg-gray-750'
                    }`}
                  >
                    <UserPlus size={13} />
                    <span>{isAddSwimmerOpen ? 'Cerrar Registro' : '＋ Nadador'}</span>
                    {isAddSwimmerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>
            </div>

            {/* Formulario colapsable para agregar nuevo nadador (Solo Operadores) */}
            {!isReadOnly && isAddSwimmerOpen && (
              <form
                onSubmit={handleAddUser}
                className="mb-4 p-3.5 bg-gray-950 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between text-xs font-mono uppercase text-gray-300 font-bold">
                  <div className="flex items-center gap-1.5">
                    <UserPlus size={14} className="text-emerald-400" />
                    <span>Registrar Nuevo Nadador</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-normal">
                    ID asignado: #{(userData || []).reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1}
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
                    aria-label="Cédula del nadador"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddSwimmerOpen(false)}
                    className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white bg-gray-850 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>Guardar Nadador</span>
                  </button>
                </div>
              </form>
            )}

            {/* Listado de Nadadores */}
            {swimmersList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 font-mono text-xs border border-dashed border-gray-800 rounded-xl bg-gray-950/40">
                <Users size={32} className="mx-auto mb-2 text-gray-600" />
                <p>No hay nadadores registrados actualmente.</p>
                {!isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => setIsAddSwimmerOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs hover:bg-emerald-600/30 transition-colors"
                  >
                    <UserPlus size={13} />
                    <span>Registrar primer nadador</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-gray-500 mt-1">Los nadadores aparecerán aquí cuando la mesa técnica los registre.</p>
                )}
              </div>
            ) : (
              <>
                {/* Vista Tarjetas para Móviles (hidden en md+) */}
                <div className="block md:hidden space-y-2.5">
                  {swimmersList.map((swimmer) => {
                    const isRunning = swimmer.isRunning
                    return (
                      <div
                        key={swimmer.cedula || swimmer.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isRunning
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                            : 'bg-gray-850/80 border-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mr-1.5">
                              #{String(swimmer.id).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-gray-100 text-sm">
                              {swimmer.nombre} {swimmer.apellido}
                            </span>
                            {swimmer.laneBadge && (
                              <span className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                swimmer.laneBadge === 'Carril 1'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              }`}>
                                {swimmer.laneBadge}
                              </span>
                            )}
                          </div>
                          {isRunning ? (
                            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              En carrera
                            </span>
                          ) : swimmer.hasScore ? (
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                              ✓ Finalizado
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 border border-gray-750 px-2 py-0.5 rounded-full">
                              En espera
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-gray-400">
                          <span>CI: <strong className="text-gray-300">{swimmer.cedula || 'S/N'}</strong></span>
                          {swimmer.edad && <span>{swimmer.edad} años</span>}
                        </div>

                        <div className="mt-2 p-2 bg-gray-950 rounded-lg flex items-center justify-between border border-gray-800">
                          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
                            <Timer size={13} className={isRunning ? 'text-emerald-400 animate-spin' : 'text-gray-500'} />
                            <span>Tiempo:</span>
                          </div>
                          <span className={`text-base font-mono font-bold ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-gray-200'}`}>
                            {swimmer.timeFormatted}
                          </span>
                        </div>

                        {/* Botones de acción (SOLO VISIBLES PARA OPERADORES) */}
                        {!isReadOnly && (
                          <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-gray-800">
                            <button
                              type="button"
                              onClick={() => handleChronoToggle(swimmer.id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                                isRunning
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {isRunning ? <Pause size={14} /> : <Play size={14} />}
                              <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetScore(swimmer.id)}
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-amber-300 border border-gray-700 transition-colors cursor-pointer"
                              title="Reiniciar cronómetro"
                            >
                              <RotateCw size={15} />
                            </button>

                            {confirmDeleteId === swimmer.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(swimmer.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-gray-800 text-gray-300 text-[10px] font-mono rounded-lg cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(swimmer.id)}
                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 border border-gray-700 transition-colors cursor-pointer"
                                title="Eliminar nadador"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
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
                        <th className="py-2.5 px-3 text-center">{isReadOnly ? 'Estado' : 'Acciones'}</th>
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
                            <td className="py-2.5 px-3 text-gray-200">
                              <span>{swimmer.nombre}</span>
                              {swimmer.laneBadge && (
                                <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                  swimmer.laneBadge === 'Carril 1'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}>
                                  {swimmer.laneBadge}
                                </span>
                              )}
                            </td>
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
                              {/* Modo Espectador: Solo muestra estado sutil */}
                              {isReadOnly ? (
                                <div>
                                  {isRunning ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                      En carrera
                                    </span>
                                  ) : swimmer.hasScore ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                                      Finalizado
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-400 bg-gray-800/80 border border-gray-700">
                                      En espera
                                    </span>
                                  )}
                                </div>
                              ) : (
                                /* Modo Operador: Botones de control completos */
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleChronoToggle(swimmer.id)}
                                    className={`p-1.5 rounded transition-all cursor-pointer ${
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
                                    className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 transition-colors cursor-pointer"
                                    title="Reiniciar tiempo"
                                  >
                                    <RotateCw size={14} />
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
                                      <Trash2 size={14} />
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
              </>
            )}

            {/* Footer de la tarjeta con resumen contextual */}
            <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <Info size={12} className="text-gray-400" />
                {isReadOnly
                  ? 'Tiempos sincronizados en tiempo real con el marcador de piscina'
                  : 'Modo operador: Los cambios se publican inmediatamente al hardware'}
              </span>
              {isReadOnly && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold cursor-pointer"
                >
                  Acceder como Operador →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMNA DERECHA: MODO DE PANTALLA Y AJUSTES DE HARDWARE (5 cols)
        ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tarjeta 1: Modo de Visualización Display (Records vs Cronómetro) */}
          <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-gray-200 font-bold">
                <Monitor size={15} className="text-emerald-400" />
                <span>Modo Pantalla Display</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">128×32 RGB</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleScreenType('show')}
                className={`py-2 px-2.5 rounded-xl font-mono text-xs font-bold transition-all border text-center cursor-pointer ${
                  currentScreen === 'show'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-850 text-gray-300 border-gray-750 hover:bg-gray-800'
                }`}
              >
                <div className="text-xs">VISUALIZACIÓN</div>
                <div className="text-[10px] opacity-75 font-normal">Records y Clima</div>
              </button>

              <button
                type="button"
                onClick={() => handleScreenType('chrono')}
                className={`py-2 px-2.5 rounded-xl font-mono text-xs font-bold transition-all border text-center cursor-pointer ${
                  currentScreen === 'chrono'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-gray-850 text-gray-300 border-gray-750 hover:bg-gray-800'
                }`}
              >
                <div className="text-xs">CRONÓMETRO</div>
                <div className="text-[10px] opacity-75 font-normal">En Vivo (Rounds)</div>
              </button>
            </div>
          </div>

          {/* Tarjeta 2: VISTA ESPECTADOR (Telemetría limpia) vs VISTA OPERADOR (Pestañas de control) */}
          {isReadOnly ? (
            /* Vista Limpia para Espectador: Solo telemetría y color local */
            <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-300 font-bold flex items-center gap-1.5">
                  <Sliders size={14} className="text-cyan-400" />
                  <span>Telemetría de la Piscina</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  En Vivo
                </span>
              </div>

              {/* Indicadores rápidos */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-gray-850 border border-gray-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                    <Thermometer size={14} className="text-emerald-400" />
                    <span>Temperatura</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-emerald-300">
                    {temp}°C
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">Sensor LM35</div>
                </div>

                <div className="p-3 bg-gray-850 border border-gray-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                    <Clock size={14} className="text-cyan-400" />
                    <span>Hora Oficial</span>
                  </div>
                  <div className="text-xl font-mono font-bold text-gray-100">
                    {timeRTC?.hours !== null
                      ? `${String(timeRTC.hours).padStart(2, '0')}:${String(timeRTC.minutes).padStart(2, '0')} ${timeRTC.ampm || ''}`
                      : '--:--'}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">Reloj RTC DS1307</div>
                </div>
              </div>

              {/* Personalización rápida de color para el espectador (afecta su display virtual) */}
              <div className="pt-2">
                <ColorPicker
                  color={textColor}
                  onColorChange={handleTextColorChange}
                  className="bg-gray-850/60"
                />
              </div>
            </div>
          ) : (
            /* Vista Operador: Pestañas organizadas para Color, Reloj RTC y Temperatura */
            <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-200 font-bold flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-400" />
                  <span>Ajustes de Pantalla y Sensores</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Control Mesa
                </span>
              </div>

              {/* Selector de Pestañas */}
              <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
                <button
                  type="button"
                  onClick={() => setActiveHardwareTab('color')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeHardwareTab === 'color'
                      ? 'bg-gray-800 text-emerald-300 shadow-sm border border-gray-700'
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
                      ? 'bg-gray-800 text-emerald-300 shadow-sm border border-gray-700'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Clock size={13} />
                  <span>Reloj RTC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHardwareTab('temp')}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeHardwareTab === 'temp'
                      ? 'bg-gray-800 text-emerald-300 shadow-sm border border-gray-700'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Thermometer size={13} />
                  <span>Sensor Temp</span>
                </button>
              </div>

              {/* Contenido Pestaña 1: Color LED */}
              {activeHardwareTab === 'color' && (
                <div className="animate-in fade-in duration-150">
                  <ColorPicker
                    color={textColor}
                    onColorChange={handleTextColorChange}
                    className="bg-transparent border-0 p-0"
                  />
                </div>
              )}

              {/* Contenido Pestaña 2: Reloj RTC DS1307 */}
              {activeHardwareTab === 'rtc' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Hora actual en ESP32:</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      {timeRTC?.hours !== null
                        ? `${String(timeRTC.hours).padStart(2, '0')}:${String(timeRTC.minutes).padStart(2, '0')} ${timeRTC.ampm || ''}`
                        : 'No sincronizado'}
                    </span>
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
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-medium rounded-lg shadow transition-all active:scale-95 cursor-pointer"
                    >
                      Enviar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={syncWithDeviceTime}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Clock size={13} />
                    <span>Sincronizar con reloj de este dispositivo</span>
                  </button>
                </div>
              )}

              {/* Contenido Pestaña 3: Temperatura Ambiente LM35 */}
              {activeHardwareTab === 'temp' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Medición LM35:</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
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
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-medium rounded-lg shadow transition-all active:scale-95 cursor-pointer"
                    >
                      Establecer
                    </button>
                  </div>

                  <p className="text-[11px] font-mono text-gray-400 leading-normal">
                    Permite enviar una calibración o valor de prueba al display (rango de 10°C a 60°C).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}