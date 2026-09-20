# Marcador Electrónico para Natación — Frontend

Panel de control web responsive y en tiempo real para el marcador electrónico de competencias de natación. Se comunica bidireccionalmente con el microcontrolador (**ESP32-S3**) a través de un broker MQTT (WebSocket seguro - WSS), permitiendo monitorear y controlar la matriz de LEDs (128×32), cronómetro por nadador, récords, temperatura ambiente y reloj RTC.

---

## 🚀 Tecnologías

- **React 19** — Framework de interfaz reactivo con `StrictMode` y `ErrorBoundary`
- **Vite 7** — Empaquetador ultrarrápido con *code splitting* optimizado
- **TailwindCSS 4** — Estilos utility-first adaptables (*mobile-first*)
- **HTML5 Canvas** — Renderizador de matriz LED de alto rendimiento y bajo consumo
- **MQTT.js** — Cliente MQTT sobre WebSocket Seguro (`wss://`)
- **Lucide React** — Iconografía moderna y accesible
- **Nginx Alpine + Docker** — Servidor de producción multi-etapa con compresión gzip y soporte SPA

---

## ✨ Características Principales

1. **Diseño 100% Responsive**:
   - Totalmente adaptable a teléfonos móviles, tablets al borde de la piscina y pantallas de escritorio.
   - Alternancia inteligente entre tarjetas táctiles en móviles y tabla de datos completa en escritorio.
   - Touch targets accesibles con confirmación de seguridad para evitar borrado accidental durante carreras.

2. **Simulador de Matriz LED Virtual en Canvas (128×32)**:
   - Renderizado ultrarrápido en `<canvas>` HTML5 que sustituye 4,096 nodos DOM, reduciendo el consumo de memoria en un 95%.
   - Relación de aspecto nativa 4:1 (128×32) sin desbordamiento horizontal.
   - Efecto físico realista con resplandor (*glow*) y relieve tridimensional en LEDs activos.
   - Modo pantalla completa y alternador de texto sin formato.

3. **Gestión de Competencia y Cronómetro**:
   - Registro de nadadores (Nombre, Apellido, Edad, Cédula).
   - Control de cronómetro por nadador (Play / Pausa en tiempo real).
   - Reinicio de tiempos y eliminación de registros con confirmación.
   - Visualización de récords en pantalla física y virtual.

4. **Controles Ambientales y de Tiempo**:
   - Ajuste de hora RTC (DS1307) con botón de **sincronización con 1 clic** al reloj local del dispositivo.
   - Configuración de temperatura ambiente (sensor LM35).
   - Selector de modo de pantalla: `VISUALIZACIÓN` (Récords) vs `CRONÓMETRO` (En Vivo).
   - Selector de colores de texto LED con paleta de presets y selector hexadecimal.

5. **Preparado para Producción**:
   - **Configurador MQTT en caliente**: Permite configurar el broker, puerto y credenciales desde la propia interfaz web (guardado en `localStorage` con fallback a `.env`).
   - **Indicador de estado de conexión**: Notifica en vivo si el sistema está Online, Conectando o Sin Conexión.
   - **Resiliencia ante fallos**: `ErrorBoundary` y parseo seguro de mensajes JSON para prevenir pantallas blancas.
   - Chunks JS optimizados sin advertencias de tamaño de paquete.
   - `Dockerfile` multi-stage listo para despliegue en contenedores.

---

## 📋 Requisitos

- Node.js 18+ (recomendado Node 20 o 22 LTS)
- npm o yarn
- Broker MQTT con soporte para WebSocket seguro (ej. [HiveMQ Cloud](https://www.hivemq.cloud/))

---

## ⚙️ Configuración

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   Copia la plantilla de ejemplo y ajusta tus credenciales:
   ```bash
   cp .env.example .env
   ```
   Contenido de `.env`:
   ```env
   VITE_BROKER_URL=tu-broker.hivemq.cloud
   VITE_WS_BROKER_PORT=8884
   VITE_MQTT_USERNAME=tu-usuario
   VITE_MQTT_PASSWORD=tu-password
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Verificar calidad de código (ESLint)**:
   ```bash
   npm run lint
   ```

5. **Compilar para producción**:
   ```bash
   npm run build
   ```

6. **Previsualizar build de producción**:
   ```bash
   npm run preview
   ```

7. **Desplegar a GitHub Pages (rama `gh-pages`)**:
   ```bash
   npm run deploy
   ```
   Compila automáticamente el proyecto (`predeploy`) y publica la carpeta `dist/` (con inclusión de `.nojekyll`) directamente en la rama `gh-pages` de este repositorio (`https://github.com/LisandraGar/marcador-electronico-para-natacion-frontend`).

---

## 🐳 Despliegue con Docker

Para construir y levantar el contenedor de producción con Nginx:

```bash
# Construir la imagen Docker
docker build -t marcador-frontend .

# Ejecutar el contenedor en el puerto 80
docker run -d -p 80:80 --name marcador-web marcador-frontend
```

---

## 📡 Tópicos MQTT

### Suscripciones (Frontend escucha)

| Tópico | Dirección | Descripción |
|---|---|---|
| `esp32s3/settemp` | ← ESP32 | Temperatura ambiente |
| `esp32s3/user_data` | ← ESP32 | Lista de nadadores y récords |
| `esp32s3/send_time` | ← ESP32 | Hora RTC y temperatura del display |
| `esp32s3/send_chrono` | ← ESP32 | Estado actual del cronómetro |
| `esp32s3/send_scores` | ← ESP32 | Puntuaciones guardadas |
| `esp32s3/send_color` | ← ESP32 | Color de texto configurado |
| `esp32s3/screen_type` | ← ESP32 | Modo activo (`show` / `chrono`) |
| `esp32s3/send_view` | ← ESP32 | Récords visibles actualmente en pantalla |

### Publicaciones (Frontend envía)

| Tópico | Dirección | Descripción |
|---|---|---|
| `esp32s3/get_users` | → ESP32 | Solicitar datos de nadadores y tiempos |
| `esp32s3/get_color` | → ESP32 | Solicitar color actual del display |
| `esp32s3/settime` | → ESP32 | Ajustar hora del reloj RTC |
| `esp32s3/settemp` | → ESP32 | Configurar temperatura ambiente |
| `esp32s3/setcolor` | → ESP32 | Configurar color del texto LED |
| `esp32s3/screen_type`| → ESP32 | Alternar pantalla (`show` / `chrono`) |
| `esp32s3/chrono` | → ESP32 | Control de cronómetro (`play_chrono:ID`, `pause_chrono:ID`) |
| `esp32s3/new_user` | → ESP32 | Registrar nuevo nadador |
| `esp32s3/del_score` | → ESP32 | Reiniciar puntuación/tiempo de un nadador |
| `esp32s3/del_record`| → ESP32 | Eliminar nadador definitivamente |

---

## 📁 Estructura del Código

```
frontend/
├── .env.example              # Plantilla documentada de variables de entorno
├── .gitignore                # Protege credenciales (.env) y temporales
├── Dockerfile                # Build multi-stage para producción
├── nginx.conf                # Servidor Nginx con gzip, caché y SPA
├── package.json              # Dependencias y scripts limpios
├── vite.config.js            # Configuración Vite (base: './', manualChunks)
├── public/
│   ├── favicon.svg           # Ícono SVG deportivo con temática LED
│   └── vite.svg
└── src/
    ├── App.jsx               # Header responsive, métricas y enrutamiento
    ├── main.jsx              # Punto de entrada con ErrorBoundary y StrictMode
    ├── index.css             # Directivas de Tailwind CSS 4
    ├── components/
    │   ├── MatrixDisplay.jsx     # Canvas LED 128×32 de alto rendimiento
    │   ├── TextInputForm.jsx     # Panel de control adaptable (cards/tabla)
    │   ├── ColorPicker.jsx       # Selector de colores con presets
    │   ├── MqttSettingsModal.jsx # Modal para configurar broker en caliente
    │   └── ErrorBoundary.jsx     # Captura y recuperación de excepciones
    ├── hooks/
    │   └── use-mqtt.js           # Hook MQTT con reconexión y localStorage
    └── utils/
        ├── characters.jsx        # Mapas de caracteres 5×7 y 10×16 corregidos
        └── json.js               # Parseo seguro de JSON sin excepciones
```

---

## 📄 Licencia

MIT
