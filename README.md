# Marcador Electrónico para Natación — Frontend

Panel de control web responsive y en tiempo real para el marcador electrónico de competencias de natación. Se comunica bidireccionalmente con el microcontrolador (**ESP32-S3**) a través de un broker MQTT (WebSocket seguro - WSS en HiveMQ Cloud), permitiendo monitorear y controlar la matriz de LEDs (128×32), cronómetro por nadador, récords, temperatura ambiente y reloj RTC.

**Producción activa en GitHub Pages:** [https://lisandragar.github.io/marcador-electronico-para-natacion-frontend/](https://lisandragar.github.io/marcador-electronico-para-natacion-frontend/)

---

## 🚀 Tecnologías

- **React 19** — Framework de interfaz reactivo con `StrictMode` y `ErrorBoundary`
- **Vite 7** — Empaquetador ultrarrápido con *code splitting* optimizado
- **TailwindCSS 4** — Estilos utility-first adaptables (*mobile-first*)
- **HTML5 Canvas** — Renderizador de matriz LED de alto rendimiento y bajo consumo
- **MQTT.js** — Cliente MQTT sobre WebSocket Seguro (`wss://`) con QoS 1 y cola de respaldo
- **Lucide React** — Iconografía moderna y accesible
- **Nginx Alpine + Docker** — Servidor de producción multi-etapa con compresión gzip y soporte SPA

---

## 🛡️ Arquitectura de Seguridad y Roles

La aplicación implementa un modelo de control de acceso por roles a nivel de red y de interfaz:

### 1. Modo Espectador (`marcador_web_invitado`) — *Predeterminado*
- **Permisos:** Solo Lectura (`Subscribe-Only` a nivel de broker HiveMQ).
- **Destinatarios:** Público general, espectadores en gradas, nadadores y pantallas secundarias.
- **Seguridad:** Cero riesgo de manipulación de la competencia o borrado de datos.
- **Experiencia de usuario:**
  - Visualización inmediata en tiempo real del marcador LED virtual y de los tiempos.
  - Badge `👁️ Espectador` en la cabecera y banner informativo superior.
  - Los controles de modificación están protegidos: si un espectador intenta interactuar, se muestra un aviso guiándole a autenticarse como operador.

### 2. Modo Operador (`marcador_web`) — *Mesa Técnica / Juez*
- **Permisos:** Control Total (`Publish` y `Subscribe`).
- **Destinatarios:** Jueces de piscina, cronometristas y operadores técnicos.
- **Acceso rápido:** Botón `⚡ Operador` en el modal de configuración ⚙️ para alternar sesión con 1 solo clic.
- **Almacenamiento:** Credenciales guardadas localmente en el `localStorage` del dispositivo del operador sin exponerse en repositorios públicos.

---

## ✨ Características y Funcionalidades del Sistema

1. **Diseño 100% Responsive**:
   - Adaptable a teléfonos móviles, tablets al borde de la piscina y pantallas de escritorio.
   - Alternancia entre tarjetas táctiles en móviles y tabla de datos completa en escritorio.
   - Confirmación de seguridad en dos pasos para eliminación de nadadores.

2. **Simulador de Matriz LED Virtual en Canvas (128×32)**:
   - Renderizado ultrarrápido en `<canvas>` HTML5 que sustituye 4,096 nodos DOM.
   - Relación de aspecto nativa 4:1 (128×32) con resplandor (*glow*) y relieve 3D en LEDs activos.
   - Pantalla completa y vista de texto crudo.

3. **Cronometraje Reactivo y Gestión de Nadadores**:
   - **Play / Pausa instantáneo:** El botón cambia de inmediato a color ámbar (`bg-amber-600`) con icono de pausa y la fila del nadador muestra los milisegundos corriendo en vivo.
   - **Prevención de colisión:** Reinicia el cronometraje limpio sin ser cancelado prematuramente por récords previos.
   - **Sincronización con hardware:** Compatible con la parada automática del cronómetro mediante el **sensor táctil sumergible de llegada** en la pared de la piscina.
   - **Generación robusta de IDs:** Cálculo dinámico con `Math.max(...ids) + 1` para evitar colisiones si se borran nadadores intermedios.
   - **Actualizaciones optimistas:** Eliminación y reinicio de tiempos instantáneos en la interfaz con sincronización diferida (250 ms) para asegurar la escritura en la memoria flash SPI del ESP32.

4. **Controles Ambientales y de Tiempo**:
   - Ajuste de hora RTC (DS1307) manual y botón de **sincronización con 1 clic** al reloj del dispositivo.
   - Ajuste de temperatura ambiente (sensor LM35) con validación (10°C - 60°C).
   - Alternador de vistas: `VISUALIZACIÓN` (Récords) vs `CRONÓMETRO` (En Vivo).
   - Selector de colores LED con presets y debounce de 150 ms para proteger el bus y la flash del microcontrolador.

5. **Detección de Hardware en Vivo**:
   - Monitoreo del tópico LWT `esp32s3/status`. Muestra en el header `ESP32 OK` cuando la placa física está encendida y conectada.

---

## 📡 Tópicos MQTT

### Suscripciones (Frontend escucha)

| Tópico | Origen | Descripción |
|---|---|---|
| `esp32s3/status` | ESP32 | Estado de conexión hardware (`online` / `offline` LWT) |
| `esp32s3/user_data` | ESP32 | Lista JSON de nadadores y récords registrados |
| `esp32s3/send_time` | ESP32 | Hora RTC (hh, mm, ss, ampm) y temperatura LM35 |
| `esp32s3/send_chrono` | ESP32 | Cronómetro activo en tiempo real (hh, mm, ss, ms, id) |
| `esp32s3/send_scores` | ESP32 | Lista de tiempos/récords finalizados |
| `esp32s3/send_color` | ESP32 | Color de texto LED activo en el display |
| `esp32s3/screen_type` | ESP32 | Modo activo (`show` / `chrono`) |
| `esp32s3/send_view` | ESP32 | Récords mostrados en rotación en la matriz física |

### Publicaciones (Frontend envía — Rol Operador)

| Tópico | Destino | Descripción |
|---|---|---|
| `esp32s3/get_users` | ESP32 | Solicitar sincronización de nadadores y tiempos |
| `esp32s3/settime` | ESP32 | Ajustar hora del reloj RTC (`HH:MM`) |
| `esp32s3/settemp` | ESP32 | Configurar temperatura ambiente (`10-60`) |
| `esp32s3/setcolor` | ESP32 | Configurar color del texto LED (`#HEX`) |
| `esp32s3/screen_type`| ESP32 | Alternar pantalla (`show` / `chrono`) |
| `esp32s3/chrono` | ESP32 | Control de cronómetro (`play_chrono:ID`, `pause_chrono:ID`) |
| `esp32s3/new_user` | ESP32 | Registrar nuevo nadador (Payload JSON) |
| `esp32s3/del_score` | ESP32 | Reiniciar tiempo de un nadador (`ID`) |
| `esp32s3/del_record`| ESP32 | Eliminar nadador definitivamente (`ID`) |

---

## ⚙️ Configuración y Despliegue

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Variables de entorno (`.env`)**:
   ```env
   VITE_BROKER_URL=90ee163ce96e47e2ab0300d92f22e9d5.s1.eu.hivemq.cloud
   VITE_WS_BROKER_PORT=8884
   VITE_MQTT_USERNAME=marcador_web_invitado
   # Por defecto se utiliza marcador_web_invitado para modo espectador
   VITE_MQTT_PASSWORD=
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Verificar calidad de código y seguridad**:
   ```bash
   npm run lint
   npm run check-secrets
   ```

5. **Desplegar a GitHub Pages**:
   ```bash
   npm run deploy
   ```

---

## 📄 Licencia

MIT
