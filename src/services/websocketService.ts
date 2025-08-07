import { Subject, Observable } from 'rxjs';
import { SystemMetrics } from './systemService';

// STOMP Protocol Message Types
interface StompMessage<T = any> {
  type: 'CONNECTED' | 'MESSAGE' | 'RECEIPT' | 'ERROR' | 'HEARTBEAT';
  body?: string;
  destination?: string;
  messageId?: string;
  subscription?: string;
  headers?: Record<string, string>;
  ack?: (headers?: { [key: string]: any }) => void;
  nack?: (headers?: { [key: string]: any }) => void;
}

// Custom message formats
export interface SystemMetricsUpdate {
  type: 'metrics';
  data: SystemMetrics;
  timestamp: string;
}

export interface SystemStatusUpdate {
  type: 'status';
  data: {
    componentName: string;
    status: 'UP' | 'DOWN' | 'DEGRADED';
    timestamp: string;
  };
}

export type SystemUpdate = StompMessage | SystemMetricsUpdate | SystemStatusUpdate;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<SystemUpdate>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnected) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      // Set up ping/pong to keep connection alive
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send initial subscription message for system metrics
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: 'SUBSCRIBE',
            destination: '/topic/system-metrics',
            id: 'system-metrics-sub'
          }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.socket?.close();
      };
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      this.isConnected = false;
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public getMessages(): Observable<SystemUpdate> {
    return this.messageSubject.asObservable();
  }

  public close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
    }
    this.messageSubject.complete();
  }
}

export const webSocketService = new WebSocketService();

// Auto-reconnect when the page becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !webSocketService['isConnected']) {
    webSocketService['connect']();
  }
});

// Export for testing
export const __test__ = {
  WebSocketService,
};
