# Sistema de Natación - Frontend

Frontend web para el sistema de puntuación electrónica de competencias de natación, controlado por un microcontrolador ESP32-S3.

## Tecnologías

- **React 19** - Framework de UI
- **Vite** - Build tool
- **TailwindCSS 4** - Estilos
- **MQTT.js** - Comunicación via WebSocket seguro (WSS)
- **Lucide React** - Iconos

## Características

- **Matriz de LEDs 128x64** - Visualización de texto y puntuación
- **Comunicación en tiempo real** - Conexión bidireccional con ESP32-S3 via MQTT
- **Cronómetro** - Control del tiempo de competencia
- **Sistema de puntuación** - Records y scores de nadadores
- **Visualización de temperatura** - Datos del sensor
- **Reloj RTC** - Hora en tiempo real
- **Personalización de colores** - Configuración del color de texto

## Configuración

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno en `.env`:
   ```env
   VITE_BROKER_URL=tu-broker.hivemq.cloud
   VITE_WS_BROKER_PORT=8884
   VITE_MQTT_USERNAME=tu-usuario
   VITE_MQTT_PASSWORD=tu-password
   ```

3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

4. Build para producción:
   ```bash
   npm run build
   ```

## Topics MQTT

| Topic | Dirección | Descripción |
|-------|-----------|-------------|
| `esp32s3/get_users` | → ESP32 | Solicitar datos de usuarios |
| `esp32s3/get_color` | → ESP32 | Solicitar configuración de color |
| `esp32s3/user_data` | ← ESP32 | Datos de usuarios y records |
| `esp32s3/send_time` | ← ESP32 | Hora RTC y temperatura |
| `esp32s3/send_chrono` | ← ESP32 | Tiempo del cronómetro |
| `esp32s3/send_scores` | ← ESP32 | Puntuaciones |
| `esp32s3/send_color` | ← ESP32 | Color configurado |
| `esp32s3/screen_type` | ← ESP32 | Tipo de pantalla |
| `esp32s3/send_view` | ← ESP32 | Vista de records |

## Estructura del Proyecto

```
src/
├── components/
│   ├── MatrixDisplay.jsx    # Componente de matriz de LEDs
│   ├── TextInputForm.jsx   # Formulario de control
│   └── ColorPicker.jsx     # Selector de color
├── hooks/
│   └── use-mqtt.js        # Hook para comunicación MQTT
├── utils/
│   └── characters.jsx      # Patrones de caracteres para matriz
├── App.jsx                # Componente principal
└── main.jsx               # Punto de entrada
```

## Licencia

MIT