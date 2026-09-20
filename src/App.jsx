import { useEffect, useState, useCallback, useMemo } from 'react'
import { MatrixDisplay } from './components/MatrixDisplay'
import { TextInputForm } from './components/TextInputForm'
import { MqttSettingsModal } from './components/MqttSettingsModal'
import { useMQTT } from './hooks/use-mqtt'
import { safeJsonParse } from './utils/json'
import {
  Wifi,
  WifiOff,
  Settings,
  Waves,
  RefreshCw,
  Clock,
  Thermometer,
  AlertCircle
} from 'lucide-react'

function App() {
  const [displayText, setDisplayText] = useState('')
  const [textColor, setTextColor] = useState('#10B981')
  const [inactiveColor, setInactiveColor] = useState('#181b22')
  const [isGetUsers, setIsGetUsers] = useState(false)
  const [userData, setUserData] = useState([])
  const [temp, setTemp] = useState('28')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [timeRTC, setTimeRTC] = useState({
    hours: null,
    minutes: null,
    seconds: null,
    ampm: null,
  })

  const [timeChrono, setTimeChrono] = useState({
    id: null,
    hh: null,
    mm: null,
    ss: null,
    ms: null,
  })

  const [scores, setScores] = useState([])
  const [currentScreen, setCurrentScreen] = useState('show') // 'show' o 'chrono'
  const [twoRecords, setTwoRecords] = useState([
    { ms: '', ss: '', mm: '', id: '', hh: '' },
    { ms: '', ss: '', mm: '', id: '', hh: '' },
  ])

  const mqttTopics = useMemo(
    () => [
      'esp32s3/settemp',
      'esp32s3/user_data',
      'esp32s3/send_time',
      'esp32s3/send_chrono',
      'esp32s3/send_scores',
      'esp32s3/send_color',
      'esp32s3/screen_type',
      'esp32s3/send_view',
    ],
    []
  )

  const { messages, isConnected, status, error, publish, config } = useMQTT(mqttTopics)

  // Solicitar datos al conectar con el microcontrolador
  useEffect(() => {
    if (isConnected && !isGetUsers) {
      publish('esp32s3/get_users', '')
      publish('esp32s3/get_color', '')
      setIsGetUsers(true)
    }
  }, [isConnected, isGetUsers, publish])

  // Procesar datos de usuario y récords
  useEffect(() => {
    const rawData = messages['esp32s3/user_data']
    if (!rawData) return

    const objData = safeJsonParse(rawData)
    if (objData) {
      const records = Array.isArray(objData.records)
        ? objData.records.map((elem) => safeJsonParse(elem, elem))
        : []
      const parsedScores = Array.isArray(objData.scores)
        ? objData.scores.map((score) => safeJsonParse(score, score))
        : []

      setUserData(records)
      setScores(parsedScores)
    }
  }, [messages])

  // Procesar hora RTC y temperatura
  useEffect(() => {
    const rawTime = messages['esp32s3/send_time']
    if (!rawTime) return

    const parsed = safeJsonParse(rawTime)
    if (parsed) {
      if (parsed.timedata) setTimeRTC(parsed.timedata)
      if (parsed.temp !== undefined && parsed.temp !== null) setTemp(String(parsed.temp))
    }
  }, [messages])

  // Procesar tiempo del cronómetro
  useEffect(() => {
    const rawChrono = messages['esp32s3/send_chrono']
    if (!rawChrono) return

    const parsed = safeJsonParse(rawChrono)
    if (parsed) {
      setTimeChrono(parsed)
    }
  }, [messages])

  // Procesar puntajes
  useEffect(() => {
    const rawScores = messages['esp32s3/send_scores']
    if (!rawScores) return

    const parsed = safeJsonParse(rawScores)
    if (Array.isArray(parsed)) {
      setScores(parsed.map((score) => safeJsonParse(score, score)))
    }
  }, [messages])

  // Procesar color del texto
  useEffect(() => {
    const rawColor = messages['esp32s3/send_color']
    if (!rawColor) return

    if (rawColor.startsWith('#')) {
      setTextColor(rawColor)
    } else {
      const hex = Number(rawColor).toString(16).padStart(6, '0')
      setTextColor(`#${hex}`)
    }
  }, [messages])

  // Procesar tipo de pantalla
  useEffect(() => {
    const rawScreen = messages['esp32s3/screen_type']
    if (rawScreen) {
      setCurrentScreen(rawScreen)
    }
  }, [messages])

  // Procesar récords para visualización
  useEffect(() => {
    const rawView = messages['esp32s3/send_view']
    if (!rawView) return

    const parsed = safeJsonParse(rawView)
    if (Array.isArray(parsed) && parsed.length > 0) {
      setTwoRecords(parsed)
    }
  }, [messages])

  const handleRefreshData = useCallback(() => {
    if (isConnected) {
      publish('esp32s3/get_users', '')
      publish('esp32s3/get_color', '')
    }
  }, [isConnected, publish])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* ========================================================
          BARRA DE NAVEGACIÓN SUPERIOR (RESPONSIVE)
      ======================================================== */}
      <header className="sticky top-0 z-40 bg-gray-900/90 border-b border-gray-800 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Waves size={22} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-mono text-gray-100 uppercase tracking-tight flex items-center gap-2">
                <span>Marcador de Natación</span>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 font-mono hidden sm:block">
                ESP32-S3 + Display RGB 128×32
              </p>
            </div>
          </div>

          {/* Métricas rápidas y estado de conexión */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge de Hora RTC */}
            {timeRTC?.hours !== null && (
              <div className="hidden md:flex items-center gap-1.5 bg-gray-850 px-2.5 py-1 rounded-lg border border-gray-700/60 text-xs font-mono text-gray-300">
                <Clock size={13} className="text-emerald-400" />
                <span>
                  {String(timeRTC.hours).padStart(2, '0')}:{String(timeRTC.minutes).padStart(2, '0')} {timeRTC.ampm}
                </span>
              </div>
            )}

            {/* Badge de Temperatura */}
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-850 px-2.5 py-1 rounded-lg border border-gray-700/60 text-xs font-mono text-emerald-300">
              <Thermometer size={13} className="text-emerald-400" />
              <span>{temp}°C</span>
            </div>

            {/* Botón de Refresco de datos */}
            <button
              onClick={handleRefreshData}
              disabled={!isConnected}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-850 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none text-gray-300 border border-gray-700/60 font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Solicitar datos actualizados al ESP32"
              aria-label="Actualizar datos"
            >
              <RefreshCw size={14} className={isConnected ? 'hover:rotate-180 transition-transform' : ''} />
              <span className="hidden lg:inline">Actualizar</span>
            </button>

            {/* Badge interactivo de Conexión MQTT */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : status === 'connecting' || status === 'reconnecting'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
              }`}
              title="Click para ver/editar configuración del Broker MQTT"
            >
              {isConnected ? (
                <>
                  <Wifi size={14} className="text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : status === 'connecting' || status === 'reconnecting' ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-amber-400" />
                  <span className="hidden sm:inline">Conectando</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-400" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
              <Settings size={13} className="ml-1 opacity-70" />
            </button>
          </div>
        </div>
      </header>

      {/* Banner de alerta si la conexión falla o falta configuración */}
      {error && !isConnected && (
        <div className="bg-red-950/80 border-b border-red-500/30 px-4 py-2 text-xs font-mono text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>
              <strong>Atención MQTT:</strong> {error}
            </span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="underline font-bold hover:text-white shrink-0"
          >
            Ajustar conexión
          </button>
        </div>
      )}

      {/* ========================================================
          CONTENIDO PRINCIPAL
      ======================================================== */}
      <main className="container mx-auto px-3 sm:px-4 py-6 space-y-6 flex-1">
        {/* Simulación en Canvas de la Matriz LED */}
        <section aria-label="Visualizador de Matriz LED">
          <MatrixDisplay
            text={displayText}
            textColor={textColor}
            inactiveColor={inactiveColor}
          />
        </section>

        {/* Panel de Control y Formularios */}
        <section aria-label="Controles del Marcador">
          <TextInputForm
            onTextSubmit={setDisplayText}
            onColorChange={setTextColor}
            setInactiveColor={setInactiveColor}
            timeChrono={timeChrono}
            setTimeChrono={setTimeChrono}
            timeRTC={timeRTC}
            userData={userData}
            scores={scores}
            publish={publish}
            temp={temp}
            setTemp={setTemp}
            currentScreen={currentScreen}
            twoRecords={twoRecords}
          />
        </section>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-gray-900 bg-gray-950 py-4 text-center text-xs font-mono text-gray-400">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema de Marcador Electrónico para Natación</span>
          <span>
            Broker: <code className="text-gray-400">{config.host || 'No configurado'}</code>
          </span>
        </div>
      </footer>

      {/* Modal de Configuración MQTT en caliente */}
      <MqttSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentStatus={status}
        currentError={error}
      />
    </div>
  )
}

export default App