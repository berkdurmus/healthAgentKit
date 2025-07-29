// API service for connecting to Health Agent Kit backend

const API_BASE_URL = 'http://localhost:3002/api';
const WS_URL = 'ws://localhost:3002';

interface AgentData {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  capabilities: string[];
  performance: {
    accuracy: number;
    efficiency: number;
    avgResponseTime: number;
    patientsProcessed: number;
    totalReward: number;
    decisionConfidence: number;
    learningProgress?: number;
  };
  stats: any;
}

interface PatientData {
  id: string;
  demographics: any;
  medicalHistory: any;
  currentCondition: any;
  vitalSigns: any;
  socialDeterminants: any;
  riskFactors: any[];
  allergies: any[];
  medications: any[];
}

interface PerformanceData {
  realTimeMetrics: {
    activeAgents: number;
    totalThroughput: number;
    avgResponseTime: number;
    successRate: number;
    currentEpisode: number;
    queueLength: number;
  };
  agentComparison: Array<{
    agentName: string;
    accuracy: number;
    efficiency: number;
    throughput: number;
    totalReward: number;
  }>;
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    errorRate: number;
  };
}

class HealthAgentAPI {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  // HTTP API methods
  async get(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API GET error for ${endpoint}:`, error);
      throw error;
    }
  }

  async post(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API POST error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Agent methods
  async getAgents(): Promise<AgentData[]> {
    return this.get('/agents');
  }

  async getAgent(id: string): Promise<AgentData> {
    return this.get(`/agents/${id}`);
  }

  // Patient methods
  async generatePatient(options?: any): Promise<PatientData> {
    return this.post('/patients/generate', options);
  }

  async getPatientStats(): Promise<any> {
    return this.get('/patients/stats');
  }

  // Environment methods
  async getEnvironment(): Promise<any> {
    return this.get('/environment');
  }

  // Simulation methods
  async startSimulation(): Promise<any> {
    return this.post('/simulation/start');
  }

  async stopSimulation(): Promise<any> {
    return this.post('/simulation/stop');
  }

  async resetSimulation(): Promise<any> {
    return this.post('/simulation/reset');
  }

  // Performance methods
  async getPerformanceMetrics(): Promise<PerformanceData> {
    return this.get('/performance');
  }

  // Health check
  async getHealth(): Promise<any> {
    return this.get('/health');
  }

  // WebSocket connection
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);
        
        this.ws.onopen = () => {
          console.log('🔌 Connected to Health Agent Kit API');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('🔌 Disconnected from Health Agent Kit API');
          // Attempt to reconnect after 3 seconds
          setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(message: any) {
    const { type, data } = message;
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => handler(data));
  }

  // Event handling
  on(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Send WebSocket message
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }
}

// Create singleton instance
export const healthAgentAPI = new HealthAgentAPI();

// Export types
export type { AgentData, PatientData, PerformanceData }; 