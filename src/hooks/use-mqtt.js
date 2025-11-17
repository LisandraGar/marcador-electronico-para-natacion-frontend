import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

export const useMQTT = (brokerUrl, topics = []) => {
    const [messages, setMessages] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const clientRef = useRef(null);

    useEffect(() => {
        const options = {
            username: import.meta.env.VITE_MQTT_USERNAME,
            password: import.meta.env.VITE_MQTT_PASSWORD,
            protocol: 'wss',
            port: import.meta.env.VITE_WS_BROKER_PORT, // Puerto para WSS en HiveMQ
            reconnectPeriod: 5000, // Reconectar cada 5 segundos
            connectTimeout: 30 * 1000, // 30 segundos timeout
            rejectUnauthorized: false // Importante para HiveMQ Cloud
        };

        console.log('🔗 Conectando a:', brokerUrl);

        const client = mqtt.connect(brokerUrl, options);
        clientRef.current = client;

        client.on('connect', () => {
            console.log('✅ Conectado al broker MQTT');
            setIsConnected(true);
            setError(null);
            
            // Suscribirse a cada topic
            topics.forEach(topic => {
                client.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`❌ Error suscribiendo a ${topic}:`, err);
                    } else {
                        console.log(`📡 Suscrito a: ${topic}`);
                    }
                });
            });
        });

        client.on('message', (topic, payload) => {
            console.log(`📨 Mensaje recibido [${topic}]:`, payload.toString());
            setMessages(prev => ({
                ...prev,
                [topic]: payload.toString()
            }));
        });

        client.on('error', (error) => {
            console.error('❌ Error MQTT:', error);
            setError(error.message);
            setIsConnected(false);
        });

        client.on('close', () => {
            console.log('🔌 Conexión MQTT cerrada');
            setIsConnected(false);
        });

        client.on('offline', () => {
            console.log('📴 Cliente MQTT offline');
            setIsConnected(false);
        });

        return () => {
            console.log('🧹 Limpiando conexión MQTT');
            client.end();
        };
    }, [brokerUrl, topics.join(',')]);

    const publish = (topic, message) => {
        if (!isConnected || !clientRef.current) {
            console.error('❌ No se puede publicar - Cliente no conectado');
            return;
        }
        console.log(`📤 Publicando en [${topic}]:`, message);
        clientRef.current.publish(topic, message);    
    };

    return { messages, isConnected, error, publish };
};