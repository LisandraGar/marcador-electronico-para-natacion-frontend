import { use, useEffect, useState } from 'react'
import { Pause, Play, RotateCw, Trash } from 'lucide-react'


const PRESET_COLORS = {
    text: ['#10B981', '#34D399', '#22D3EE', '#8B5CF6', '#F59E0B', '#EF4444', '#FFFFFF', '#000000'],
    background: ['#000000', '#047857', '#0F766E', '#1E3A8A', '#422006', '#7F1D1D', '#2b0318', '#111827']
}

export const TextInputForm = ({ 
    onTextSubmit, onColorChange, timeRTC, timeChrono, setTimeChrono, 
    userData, scores, publish, temp, setTemp, currentScreen, twoRecords
}) => {
    const [textColor, setTextColor] = useState('#10B981')
    const [time, setTime] = useState('12:00')
    const [formData, setFormData] = useState({ id: '', nombre: '', apellido: '', edad: '', cedula: '' })
    const [isPlayChrono, setIsPlayChrono] = useState([])

    // Centraliza el formato de la matriz
    const formatMatrixText = (h, m, ampm, t, tc, tr) => {
        tr = scores?.length <= 2 ? scores : tr

        const t_hh = String(h ?? 0).padStart(2, '0')
        const t_mm = String(m ?? 0).padStart(2, '0')
        const c_hh = String(tc?.hh ?? 0).padStart(2, '0')
        const c_mm = String(tc?.mm ?? 0).padStart(2, '0')
        const c_ss = String(tc?.ss ?? 0).padStart(2, '0')
        const c_ms = String(tc?.ms ?? 0).padStart(2, '0')
        const tr0_str = tr[0] ? `RECORDS ${tr[0].id}.${String(tr[0].hh).padStart(2, '0')}:${String(tr[0].mm).padStart(2, '0')}:${String(tr[0].ss).padStart(2, '0')}.${String(tr[0].ms).padStart(2, '0')}` : 'RECORDS'
        const tr1_str = tr[1] ? `${tr[1].id}.${String(tr[1].hh).padStart(2, '0')}:${String(tr[1].mm).padStart(2, '0')}:${String(tr[1].ss).padStart(2, '0')}.${String(tr[1].ms).padStart(2, '0')}` : ''
        if (currentScreen === 'chrono') return `    ${t_hh}:${t_mm} ${ampm} - ${t}°\n  Round|HH|MM|SS|MS\n    ${tc?.id ?? 0}  |${c_hh}|${c_mm}|${c_ss}|${c_ms}`
        return `${t_hh}:${t_mm} ${ampm}      HEAT ${temp}\n${tr0_str}\n        ${tr1_str}`
    }

    useEffect(() => {
        onTextSubmit(formatMatrixText(
            timeRTC?.hours ?? 0, 
            timeRTC?.minutes ?? 0, 
            timeRTC?.ampm ?? 'AM', 
            temp,
            timeChrono,
            twoRecords
        ))
    }, [timeRTC, timeChrono, temp])

    useEffect(() => setIsPlayChrono(Array.from({ length: userData?.length || 0 }, () => false)), [])

    useEffect(() => {
        if (twoRecords.length === 0) return
        onTextSubmit(formatMatrixText(
            timeRTC?.hours ?? 0, 
            timeRTC?.minutes ?? 0, 
            timeRTC?.ampm ?? 'AM', 
            temp,
            timeChrono,
            twoRecords
        ))
    }, [timeRTC, twoRecords, temp])

    useEffect(() => {
        onTextSubmit(formatMatrixText(
            timeRTC?.hours ?? 0, 
            timeRTC?.minutes ?? 0, 
            timeRTC?.ampm ?? 'AM', 
            temp,
            timeChrono,
            twoRecords
        ))
    }, [currentScreen])

    const handleChrono = (id) => {
        const newIsPlayChrono = [...isPlayChrono]
        newIsPlayChrono[id] = !newIsPlayChrono[id]
        setIsPlayChrono(newIsPlayChrono)
        publish('esp32s3/chrono', newIsPlayChrono[id] ? `play_chrono:${id}` : `pause_chrono:${id}`)
    }

    const handleAdd = () => {
        if (!formData.nombre || !formData.cedula) return
        publish('esp32s3/new_user', JSON.stringify(formData))
        publish('esp32s3/get_users', 'get_users')
        setFormData({ id: '', nombre: '', apellido: '', edad: '', cedula: '' })
    }

    const handleDeleteScore = (id) => {
        publish('esp32s3/del_score', String(id))
        publish('esp32s3/get_users', 'get_users')
        setTimeChrono({ id: null, hh: null, mm: null, ss: null, ms: null })
    }

    const handleDeleteRecord = (id) => {
        publish('esp32s3/del_record', String(id))
        publish('esp32s3/get_users', 'get_users')
    }

    const sendTimeToRTC = () => {
        publish('esp32s3/settime', time)
        let [hour, minute] = time.split(':').map(Number)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        hour = hour % 12 || 12

        onTextSubmit(formatMatrixText(hour, minute, ampm, temp))
        console.log("Hora enviada:", time)
    }

    const handleTextColorChange = (color) => {
        setTextColor(color)
        onColorChange?.(color)
        publish('esp32s3/setcolor', color)
    }

    const sendTempToDisplay = () => {
        publish('esp32s3/settemp', temp)
        // Usamos la hora actual del estado para no "resetear" el display a 00:00
        onTextSubmit(formatMatrixText(time.split(':')[0], time.split(':')[1], 'AM', temp))
        console.log("Temperatura enviada:", temp)
    }
    
    const handleChangeTemp = (e) => {
        const value = e.target.value
        if (value !== "" && (isNaN(value) || value < 16 || value > 50)) return
        setTemp(value)
    }

    const handleScreenType = (type) => {
        publish('esp32s3/screen_type', type)
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 pt-0">
            <h2 className="text-xl font-bold text-green-400 mb-4 font-mono text-center">
                CONTROL PANEL - MATRIX TEXT
            </h2>

            <div className="px-9 w-full">
                <section className="space-y-6 grid gap-6 p-6 grid-cols-2 rounded-lg bg-gray-800 border-gray-700 w-full">
                    
                    <div className="w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-lg overflow-hidden font-mono">
                        <div className="grid grid-cols-8 gap-2 bg-gray-800 p-3 text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-700">
                            <span>ID</span><span>Nombre</span><span>Apellido</span><span>Edad</span><span>Cédula</span><span>Tiempo</span><span className="text-center">Acciones</span>
                        </div>

                        <div className="p-2 space-y-1">
                            {userData?.map((user, index) => {
                                const userScore = scores?.find(s => String(s.id) === String(user.id))

                                const hh = String(userScore?.hh ?? 0).padStart(2, '0')
                                const mm = String(userScore?.mm ?? 0).padStart(2, '0')
                                const ss = String(userScore?.ss ?? 0).padStart(2, '0')
                                const ms = String(userScore?.ms ?? 0).padStart(2, '0')

                                return (
                                    <div key={user.cedula} className="grid grid-cols-8 gap-2 p-2 bg-black/20 border-b border-gray-800/50 items-center text-sm text-green-100/70">
                                        <span className="text-gray-600">#{(user.id).toString().padStart(2, '0')}</span>
                                        <span>{user.nombre}</span>
                                        <span>{user.apellido}</span>
                                        <span>{user.edad}</span>
                                        <span>{user.cedula}</span>
                                        <span>{`${hh}:${mm}:${ss}.${ms}`}</span>

                                        <div className="flex gap-2 justify-center ml-20">
                                            <button onClick={() => handleChrono(user.id)} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-all duration-200"> {isPlayChrono[user.id] ? <Pause size={16} /> : <Play size={16} />}</button>
                                            <button onClick={() => handleDeleteScore(user.id)} className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-all duration-200"><RotateCw size={16} /></button>
                                            <button onClick={() => handleDeleteRecord(user.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-all duration-200"><Trash size={16} /></button>
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="flex gap-2 p-2 mt-4 bg-green-500/5 border border-green-500/30 rounded-md items-center shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                                <span className="text-green-500 font-bold">#{(userData?.length + 1).toString().padStart(2, '0')}</span>
                                <div className="grid grid-cols-4 w-full gap-2">
                                    {['nombre', 'apellido', 'edad', 'cedula'].map((field) => (
                                        <input
                                            key={field}
                                            type={field === 'edad' ? 'number' : 'text'}
                                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                            value={formData[field]}
                                            onChange={(e) => setFormData({...formData, id: userData?.length + 1, [field]: e.target.value})}
                                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-green-400 focus:border-green-500 outline-none text-sm"
                                        />
                                    ))}
                                </div>
                                <button onClick={handleAdd} className="w-8 h-8 flex items-center justify-center bg-green-600 hover:bg-green-500 text-white rounded shadow-lg transition-all active:scale-90">
                                    <span className="text-xl font-bold">+</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex space-x-4">
                            <div className="w-1/2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                <label className="block text-green-300 font-mono text-sm mb-2">AJUSTAR HORA (RTC)</label>
                                <div className="flex gap-4 items-center">
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 w-1/3 bg-gray-700 text-green-300 font-mono px-4 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none" />
                                    <button onClick={sendTimeToRTC} className="bg-green-600 hover:bg-green-700 text-white font-mono p-2 rounded-lg transition-all duration-200">SET RTC</button>
                                </div>
                            </div>
                            <div className='w-1/2 p-4 bg-gray-900 rounded-lg border border-gray-700'>
                                <label className="block text-green-300 font-mono text-sm mb-2">TEMPERATURA AMBIENTE</label>
                                <div className="flex gap-4 items-center">
                                    <input type="number" value={temp} onChange={handleChangeTemp} className="flex-1 w-1/3 bg-gray-700 text-green-300 font-mono px-4 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none" />
                                    <button onClick={sendTempToDisplay} className="bg-green-600 hover:bg-green-700 text-white font-mono p-2 rounded-lg transition-all duration-200">SET TEMP</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                <label className="block text-green-300 font-mono text-sm mb-2">COLOR DEL TEXTO</label>
                                <div className="flex items-center gap-4 mb-2">
                                    <input type="color" value={textColor} onChange={(e) => handleTextColorChange(e.target.value)} className="w-12 h-12 cursor-pointer bg-transparent border-none" />
                                    <input type="text" value={textColor} onChange={(e) => handleTextColorChange(e.target.value)} className="w-full bg-gray-700 text-green-300 font-mono px-3 py-2 rounded border border-gray-600" />
                                </div>
                                <div className="grid grid-cols-8 gap-2">
                                    {PRESET_COLORS.text.map((color, index) => (
                                        <button key={index} className={`w-8 h-8 rounded border-2 transition-all ${textColor === color ? 'border-green-400 scale-110' : 'border-gray-600'}`} style={{ backgroundColor: color }} onClick={() => handleTextColorChange(color)} />
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                <label className="block text-green-300 font-mono text-sm mb-2">PANTALLA ACTUAL</label>
                                <div className="flex flex-col gap-4">
                                    <button onClick={() => handleScreenType('chrono')} className={`w-full text-white font-mono p-2 rounded-lg transition-all duration-200 ${currentScreen === 'chrono' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-800/80'}`}>CRONÓMETRO</button>
                                    <button onClick={() => handleScreenType('show')} className={`w-full text-white font-mono p-2 rounded-lg transition-all duration-200 ${currentScreen === 'show' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-800/80'}`}>VISUALIZACIÓN</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}