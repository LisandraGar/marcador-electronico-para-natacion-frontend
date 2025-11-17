import { useEffect, useState } from 'react'
import { MatrixDisplay } from "./components/MatrixDisplay"
import { TextInputForm } from "./components/TextInputForm"
import { useMQTT } from './hooks/use-mqtt'

function App() {
	const [displayText, setDisplayText] = useState('')
	const [textColor, setTextColor] = useState('#9CA0A1')
	const [inactiveColor, setInactiveColor] = useState('#2f2f2f')
	const [isGetUsers, setIsGetUsers] = useState(false)
	const [userData, setUserData] = useState(null)
	const [temp, setTemp] = useState('28')
	const [timeRTC, setTimeRTC] = useState({
		hours: null,
		minutes: null,
		seconds: null,
		ampm: null
	})
	const [timeChrono, setTimeChrono] = useState({
		id: null,
		hh: null,
		mm: null,
		ss: null,
		ms: null
	})
	const [scores, setScores] = useState([])
	const [currentScreen, setCurrentScreen] = useState('show') // 'chrono' o 'view'
	const [twoRecords, setTwoRecords] = useState([{ms: '', ss: '', mm: '', id: '', hh: ''}, {ms: '', ss: '', mm: '', id: '', hh: ''}])

	const { messages, isConnected, error, publish } = useMQTT(
        `wss://${import.meta.env.VITE_BROKER_URL}:${import.meta.env.VITE_WS_BROKER_PORT}/mqtt`,
        [
			'esp32s3/settemp', 
			'esp32s3/user_data',
			'esp32s3/send_time',
			'esp32s3/send_chrono',
			'esp32s3/send_scores',
			'esp32s3/send_color',
			'esp32s3/screen_type',
			'esp32s3/send_view',
		]
    )

	useEffect(() => {
		if (isConnected && !isGetUsers) {
			publish('esp32s3/get_users', '')
			publish('esp32s3/get_color', '')
			setIsGetUsers(true)
		}
	}, [isConnected])

	useEffect(() => {
		// Obener los datos de usuario
		const uData = messages['esp32s3/user_data']
		const objData = uData ? JSON.parse(uData) : null
		setUserData(objData?.records.map(dataElem => JSON.parse(dataElem)))
		setScores(objData?.scores.map(score => JSON.parse(score)))
	}, [messages['esp32s3/user_data']])

	useEffect(() => {
		// Obtener la hora
		const time = messages['esp32s3/send_time']
		const objTime = time ? JSON.parse(time).timedata : null
		const temp = time ? JSON.parse(time).temp : 0
		setTimeRTC(objTime)
		setTemp(temp)
	}, [messages['esp32s3/send_time']])

	useEffect(() => {
		// Obtener el tiempo del cronómetro
		const chrono = messages['esp32s3/send_chrono']
		const objChrono = chrono ? JSON.parse(chrono) : null
		setTimeChrono(objChrono)
	}, [messages['esp32s3/send_chrono']])

	useEffect(() => {
		// Obtener los puntajes
		const _scores = messages['esp32s3/send_scores']
		const arrScores = _scores ? JSON.parse(_scores) : null
		setScores(arrScores?.map(score => JSON.parse(score)))
	}, [messages['esp32s3/send_scores']])
	useEffect(() => console.log(scores), [scores])
	useEffect(() => {
		// Obtener el color
		const color = messages['esp32s3/send_color']
		if (color) setTextColor(`#${Number(color).toString(16).padStart(6, '0')}`)
		else setTextColor('#9CA0A1')
	}, [messages['esp32s3/send_color']])

	useEffect(() => {
		// Obtener el tipo de pantalla
		const screenType = messages['esp32s3/screen_type']
		if (screenType) setCurrentScreen(screenType)
	}, [messages['esp32s3/screen_type']])

	useEffect(() => {
		// Obtener los records para la vista
		const view = messages['esp32s3/send_view']
		const arrView = view ? JSON.parse(view) : null
		if (arrView) setTwoRecords(arrView)
	}, [messages['esp32s3/send_view']])

	const handleTextSubmit = (text) => {
		setDisplayText(text)
	}

	const handleColorChange = (color) => {
		setTextColor(color)
	}
	return (
		<div className="min-h-screen bg-gray-900 py-8">
			<div className="container mx-auto px-4 space-y-8">
				<MatrixDisplay
					text={displayText}
					textColor={textColor}
					inactiveColor={inactiveColor}
				/>

				<TextInputForm
					onTextSubmit={handleTextSubmit}
					onColorChange={handleColorChange}
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
			</div>
		</div>
	)
}

export default App