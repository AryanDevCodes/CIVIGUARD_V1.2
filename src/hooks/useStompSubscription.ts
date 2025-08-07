import { useEffect, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseStompSubscriptionOptions {
  topic: string;
  onMessage: (body: any, raw: IMessage) => void;
  debug?: boolean;
}

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:'
    ? 'https://'
    : 'http://') + window.location.host + '/api/ws';

export function useStompSubscription({ topic, onMessage, debug }: UseStompSubscriptionOptions) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      ...(debug ? { debug: (str) => console.log('[STOMP]', str) } : {}),
      onConnect: () => {
        if (debug) console.log(`[STOMP] Connected, subscribing to ${topic}`);
        subscriptionRef.current = client.subscribe(topic, (message) => {
          try {
            const body = JSON.parse(message.body);
            onMessage(body, message);
          } catch (err) {
            if (debug) console.warn('[STOMP] Failed to parse message', err);
            onMessage(message.body, message);
          }
        });
      },
      onStompError: (frame) => {
        if (debug) console.error('[STOMP] Broker error', frame.headers['message'], frame.body);
      },
      onWebSocketError: (event) => {
        if (debug) console.error('[STOMP] WebSocket error', event);
      },
    });
    client.activate();
    clientRef.current = client;
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);
}
