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
        username: parsed.username ?? envUser,
        password: parsed.password ?? envPass,
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
  const clientRef = useRef(null);

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
  }, [topics]);

  const topicsKey = topics.join(',');

  useEffect(() => {
    if (!config.host) {
      setStatus('offline');
      setError('Falta configurar la URL del broker MQTT (.env o ajustes).');
      return;
    }

    const brokerUrl = `wss://${config.host}:${config.port || '8884'}/mqtt`;

    const options = {
      username: config.username,
      password: config.password,
      protocol: 'wss',
      port: Number(config.port) || 8884,
      reconnectPeriod: 5000,
      connectTimeout: 20 * 1000,
      rejectUnauthorized: false, // Requerido para brokers tipo HiveMQ Cloud WSS
    };

    setStatus('connecting');
    setError(null);

    if (import.meta.env.DEV) {
      console.log('🔗 Conectando a broker MQTT:', brokerUrl);
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

      // Suscribirse a cada topic de la lista
      topicsRef.current.forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (err && import.meta.env.DEV) {
            console.error(`❌ Error suscribiendo a ${topic}:`, err);
          }
        });
      });
    });

    client.on('message', (topic, payload) => {
      const text = payload.toString();
      setMessages((prev) => ({
        ...prev,
        [topic]: text,
      }));
    });

    client.on('error', (err) => {
      setStatus('error');
      setError(err?.message || 'Error desconocido en conexión MQTT');
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

  const publish = useCallback((topic, message) => {
    if (!clientRef.current || !clientRef.current.connected) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No se puede publicar: Cliente MQTT no conectado');
      }
      return false;
    }
    clientRef.current.publish(topic, typeof message === 'string' ? message : JSON.stringify(message));
    return true;
  }, []);

  const isConnected = status === 'connected';

  return {
    messages,
    isConnected,
    status,
    error,
    publish,
    config,
  };
};