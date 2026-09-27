import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

const STORAGE_KEY = 'marcador_mqtt_config';

/**
 * Obtiene la configuración activa de MQTT (localStorage con fallback a variables de entorno Vite)
 */
export function getStoredMqttConfig() {
  const envHost = import.meta.env.VITE_BROKER_URL || '';
  const envPort = import.meta.env.VITE_WS_BROKER_PORT || '8884';
  const envUser = import.meta.env.VITE_MQTT_USERNAME || '';
  const envPass = import.meta.env.VITE_MQTT_PASSWORD || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        host: parsed.host?.trim() || envHost,
        port: parsed.port?.trim() || envPort,
        username: parsed.username?.trim() ? parsed.username.trim() : envUser,
        password: parsed.password?.trim() ? parsed.password.trim() : envPass,
        isCustom: true,
      };
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Error leyendo configuración MQTT de localStorage:', err);
    }
  }

  return {
    host: envHost,
    port: envPort,
    username: envUser,
    password: envPass,
    isCustom: false,
  };
}

/**
 * Guarda la configuración activa de MQTT en localStorage
 */
export function saveStoredMqttConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('mqtt-config-changed'));
  } catch (err) {
    console.error('Error guardando configuración MQTT:', err);
  }
}

/**
 * Restablece la configuración activa a los valores por defecto del .env
 */
export function resetStoredMqttConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('mqtt-config-changed'));
  } catch (err) {
    console.error('Error reseteando configuración MQTT:', err);
  }
}

export const useMQTT = (topics = []) => {
  const [messages, setMessages] = useState({});
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error'
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(getStoredMqttConfig);
  const [isHardwareOnline, setIsHardwareOnline] = useState(false);
  const [lastConnectionTime, setLastConnectionTime] = useState(null);

  const clientRef = useRef(null);
  const pendingQueueRef = useRef([]); // Cola de mensajes pendientes si no está conectado

  // Escuchar cambios en la configuración guardada
  useEffect(() => {
    const handleConfigChange = () => {
      setConfig(getStoredMqttConfig());
    };
    window.addEventListener('mqtt-config-changed', handleConfigChange);
    return () => window.removeEventListener('mqtt-config-changed', handleConfigChange);
  }, []);

  const topicsRef = useRef(topics);
  useEffect(() => {
    topicsRef.current = topics;
    // Si ya está conectado y la lista de tópicos cambia, suscribir nuevos tópicos
    if (clientRef.current?.connected) {
      topics.forEach((topic) => {
        clientRef.current.subscribe(topic, { qos: 1 }, (err) => {
          if (err && import.meta.env.DEV) {
            console.error(`❌ Error suscribiendo a ${topic}:`, err);
          }
        });
      });
    }
  }, [topics]);

  const topicsKey = topics.join(',');

  useEffect(() => {
    if (!config.host) {
      setStatus('offline');
      setError('Falta configurar la URL del broker MQTT (.env o ajustes).');
      return;
    }

    if (!config.password) {
      setStatus('offline');
      setError('Falta ingresar la contraseña del broker MQTT para conectar.');
      return;
    }

    const brokerUrl = `wss://${config.host}:${config.port || '8884'}/mqtt`;
    const clientId = 'web_' + Math.random().toString(16).substring(2, 10);

    const options = {
      clientId,
      username: config.username,
      password: config.password,
      protocol: 'wss',
      port: Number(config.port) || 8884,
      clean: true,
      keepalive: 30,
      reconnectPeriod: 2000,
      connectTimeout: 15 * 1000,
      rejectUnauthorized: false,
    };

    setStatus('connecting');
    setError(null);

    if (import.meta.env.DEV) {
      console.log('🔗 Conectando a broker MQTT:', brokerUrl, 'Usuario:', config.username);
    }

    let client = null;
    try {
      client = mqtt.connect(brokerUrl, options);
      clientRef.current = client;
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Error al iniciar cliente MQTT');
      return;
    }

    client.on('connect', () => {
      setStatus('connected');
      setError(null);
      setLastConnectionTime(Date.now());

      if (import.meta.env.DEV) {
        console.log('✅ Conectado exitosamente al broker MQTT HiveMQ');
      }

      // Suscribirse a cada topic de la lista con QoS 1
      topicsRef.current.forEach((topic) => {
        client.subscribe(topic, { qos: 1 }, (err) => {
          if (err && import.meta.env.DEV) {
            console.error(`❌ Error suscribiendo a ${topic}:`, err);
          }
        });
      });

      // Procesar cola de mensajes pendientes
      if (pendingQueueRef.current.length > 0) {
        const queue = [...pendingQueueRef.current];
        pendingQueueRef.current = [];
        queue.forEach(({ topic, payload, opts }) => {
          client.publish(topic, payload, opts);
        });
      }
    });

    client.on('message', (topic, payload) => {
      const text = payload.toString();

      // Detección automática del estado del hardware ESP32
      if (topic === 'esp32s3/status') {
        setIsHardwareOnline(text === 'online');
      }

      setMessages((prev) => {
        // Optimización de rendimiento: no crear nuevo objeto si el mensaje es idéntico
        if (prev[topic] === text) return prev;
        return {
          ...prev,
          [topic]: text,
        };
      });
    });

    client.on('error', (err) => {
      setStatus('error');
      setError(err?.message || 'Error en conexión MQTT');
    });

    client.on('reconnect', () => {
      setStatus('reconnecting');
    });

    client.on('close', () => {
      setStatus('offline');
    });

    client.on('offline', () => {
      setStatus('offline');
    });

    return () => {
      if (client) {
        client.end(true);
      }
    };
  }, [config.host, config.port, config.username, config.password, topicsKey]);

  /**
   * Publica un mensaje en un topic MQTT con soporte para QoS y cola de respaldo
   */
  const publish = useCallback((topic, message, options = { qos: 1 }) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    if (!clientRef.current || !clientRef.current.connected) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Cliente MQTT no conectado. Encolando publicación en "${topic}"`);
      }
      // Mantener máximo 20 mensajes en cola para evitar consumo de memoria
      if (pendingQueueRef.current.length < 20) {
        pendingQueueRef.current.push({ topic, payload, opts: options });
      }
      return false;
    }

    try {
      clientRef.current.publish(topic, payload, options, (err) => {
        if (err && import.meta.env.DEV) {
          console.error(`❌ Error publicando en ${topic}:`, err);
        }
      });
      return true;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`❌ Excepción al publicar en ${topic}:`, err);
      }
      return false;
    }
  }, []);

  const isConnected = status === 'connected';

  return {
    messages,
    isConnected,
    isHardwareOnline,
    status,
    error,
    publish,
    config,
    lastConnectionTime,
  };
};