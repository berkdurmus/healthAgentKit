import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import { createServer } from 'http';
import { TriageEnvironment } from '../environments/triage.environment';
import { RuleBasedTriageAgent } from '../agents/rule-based.agent';
import { MLTriageAgent } from '../agents/ml.agent';
import { RandomTriageAgent } from '../agents/random.agent';
import { LLMTriageAgent } from '../agents/llm.agent';
import { SimulationEngine } from '../simulation/simulation.engine';
import { PerformanceMonitor } from '../utils/performance.monitor';
import { PatientGenerator } from '../utils/patient.generator';
import { Agent, Environment } from '../types/core.types';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Global state
let agents: Agent[] = [];
let environment: Environment | null = null;
let simulationEngine: SimulationEngine | null = null;
let performanceMonitor: PerformanceMonitor | null = null;
let patientGenerator: PatientGenerator | null = null;
let isSimulationRunning = false;
let currentEpisode = 0;

// Initialize the framework
function initializeFramework() {
  console.log('🚀 Initializing Health Agent Kit Framework...');
  
  // Create patient generator
  patientGenerator = new PatientGenerator(42); // Fixed seed for consistency
  
  // Create environment
  environment = new TriageEnvironment('emergency-dept-1', {
    maxPatients: 50,
    resources: {
      traumaBays: 4,
      urgentCareRooms: 8,
      generalBeds: 20
    },
    useRealisticPatients: true,
    patientGenerator: patientGenerator
  });
  
  // Create agents
  agents = [
    new RuleBasedTriageAgent('Rule-Based Triage', 'rule-agent-1'),
    new MLTriageAgent('ML Neural Network', 'ml-agent-1'),
    new RandomTriageAgent('Random Baseline', 42, 'random-agent-1'),
    new LLMTriageAgent('LLM Clinical Agent', 'llm-agent-1')
  ];
  
  // Create performance monitor
  performanceMonitor = new PerformanceMonitor();
  
  // Create simulation engine
  const config: SimulationConfig = {
    maxStepsPerEpisode: 100,
    enableLogging: true,
    logLevel: 'info'
  };
  
  simulationEngine = new SimulationEngine(config);
  
  console.log('✅ Framework initialized successfully!');
  console.log(`📊 Agents created: ${agents.length}`);
  console.log(`🏥 Environment: ${environment.name}`);
  console.log(`👥 Patient generator ready`);
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('📱 Frontend connected via WebSocket');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    data: {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        stats: agent.getStats()
      })),
      environment: environment ? {
        id: environment.id,
        name: environment.name,
        type: environment.type,
        stats: environment.getStats()
      } : null,
      isRunning: isSimulationRunning,
      currentEpisode
    }
  }));
  
  ws.on('close', () => {
    console.log('📱 Frontend disconnected');
  });
});

// Broadcast updates to all connected clients
function broadcastUpdate(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API Routes

// Get all agents
app.get('/api/agents', (req, res) => {
  const agentData = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    stats: agent.getStats(),
    status: isSimulationRunning ? 'active' : 'idle',
    description: getAgentDescription(agent.type),
    capabilities: getAgentCapabilities(agent.type),
    performance: {
      accuracy: 85 + Math.random() * 15, // Mock for now, will be real after episodes
      efficiency: 70 + Math.random() * 25,
      avgResponseTime: 1 + Math.random() * 4,
      patientsProcessed: agent.getStats().totalSteps,
      totalReward: Math.random() * 3000,
      decisionConfidence: 80 + Math.random() * 20,
      learningProgress: agent.type === 'ML_MODEL' ? Math.random() * 100 : undefined
    }
  }));
  
  res.json(agentData);
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    stats: agent.getStats(),
    experiences: agent.getRecentExperiences(10) // Last 10 experiences
  });
});

// Generate new patient
app.post('/api/patients/generate', (req, res) => {
  if (!patientGenerator) {
    return res.status(500).json({ error: 'Patient generator not initialized' });
  }
  
  const options = req.body || {};
  const patient = patientGenerator.generatePatient(options);
  
  res.json(patient);
});

// Get patient generator stats
app.get('/api/patients/stats', (req, res) => {
  if (!patientGenerator) {
    return res.status(500).json({ error: 'Patient generator not initialized' });
  }
  
  const stats = patientGenerator.getStats();
  res.json(stats);
});

// Get environment state
app.get('/api/environment', (req, res) => {
  if (!environment) {
    return res.status(500).json({ error: 'Environment not initialized' });
  }
  
  res.json({
    id: environment.id,
    name: environment.name,
    type: environment.type,
    currentState: environment.getCurrentState(),
    stats: environment.getStats(),
    metrics: environment.getMetrics()
  });
});

// Start simulation
app.post('/api/simulation/start', async (req, res) => {
  if (!simulationEngine || !environment || agents.length === 0) {
    return res.status(500).json({ error: 'Framework not properly initialized' });
  }
  
  if (isSimulationRunning) {
    return res.status(400).json({ error: 'Simulation already running' });
  }
  
  try {
    isSimulationRunning = true;
    const agent = agents[0]; // Use first agent for now
    
    console.log('🎮 Starting simulation...');
    
    // Subscribe to events
    simulationEngine.events$.subscribe((event: any) => {
      broadcastUpdate('SIMULATION_EVENT', event);
      
      if (event.type === 'episode_complete') {
        currentEpisode++;
      }
    });
    
    // Run simulation asynchronously
    runSimulationLoop(agent, environment);
    
    broadcastUpdate('SIMULATION_STARTED', {
      agent: { id: agent.id, name: agent.name },
      environment: { id: environment.id, name: environment.name }
    });
    
    res.json({ message: 'Simulation started', agentId: agent.id });
  } catch (error) {
    isSimulationRunning = false;
    console.error('❌ Error starting simulation:', error);
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

// Stop simulation
app.post('/api/simulation/stop', (req, res) => {
  isSimulationRunning = false;
  broadcastUpdate('SIMULATION_STOPPED', {});
  res.json({ message: 'Simulation stopped' });
});

// Reset simulation
app.post('/api/simulation/reset', (req, res) => {
  isSimulationRunning = false;
  currentEpisode = 0;
  
  // Reset agents
  agents.forEach(agent => agent.reset());
  
  // Reset environment
  if (environment) {
    environment.reset();
  }
  
  broadcastUpdate('SIMULATION_RESET', {});
  res.json({ message: 'Simulation reset' });
});

// Get performance metrics
app.get('/api/performance', (req, res) => {
  const metrics = {
    realTimeMetrics: {
      activeAgents: agents.filter(a => a.getStats().episodeCount > 0).length,
      totalThroughput: 20 + Math.random() * 15,
      avgResponseTime: 2 + Math.random() * 3,
      successRate: 88 + Math.random() * 10,
      currentEpisode,
      queueLength: environment ? (environment.getCurrentState().data as any)?.queueLength || 0 : 0
    },
    agentComparison: agents.map(agent => ({
      agentName: agent.name,
      accuracy: 85 + Math.random() * 15,
      efficiency: 70 + Math.random() * 25,
      throughput: 15 + Math.random() * 20,
      totalReward: Math.random() * 3000
    })),
    systemHealth: {
      cpuUsage: 30 + Math.random() * 40,
      memoryUsage: 50 + Math.random() * 30,
      networkLatency: 10 + Math.random() * 30,
      errorRate: Math.random() * 2
    }
  };
  
  res.json(metrics);
});

// Simulation loop
async function runSimulationLoop(agent: Agent, env: Environment) {
  let episodeCount = 0;
  const maxEpisodes = 100;
  
  while (isSimulationRunning && episodeCount < maxEpisodes) {
    try {
      console.log(`🎯 Running episode ${episodeCount + 1}`);
      
      // Run single episode
      const results = await simulationEngine!.runEpisode(agent, env);
      
      broadcastUpdate('EPISODE_COMPLETE', {
        episode: episodeCount + 1,
        results,
        agentStats: agent.getStats(),
        environmentStats: env.getStats()
      });
      
      episodeCount++;
      
      // Small delay between episodes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('❌ Error in simulation loop:', error);
      break;
    }
  }
  
  isSimulationRunning = false;
  broadcastUpdate('SIMULATION_COMPLETE', { totalEpisodes: episodeCount });
}

// Helper functions
function getAgentDescription(type: string): string {
  switch (type) {
    case 'RULE_BASED':
      return 'Clinical protocol-based triage using ESI guidelines';
    case 'ML_MODEL':
      return 'Deep learning model with reinforcement learning for triage decisions';
    case 'LLM_AGENT':
      return 'Large language model with clinical reasoning and differential diagnosis';
    default:
      return 'Healthcare decision-making agent';
  }
}

function getAgentCapabilities(type: string): string[] {
  switch (type) {
    case 'RULE_BASED':
      return ['ESI Triage Protocol', 'Clinical Decision Trees', 'Risk Assessment', 'Priority Classification'];
    case 'ML_MODEL':
      return ['Pattern Recognition', 'Adaptive Learning', 'Outcome Prediction', 'Risk Stratification', 'Experience Replay'];
    case 'LLM_AGENT':
      return ['Clinical Reasoning', 'Differential Diagnosis', 'Medical Knowledge Base', 'Symptom Analysis', 'Care Plan Generation'];
    default:
      return ['Basic Decision Making'];
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agents: agents.length,
    environment: environment?.name || 'not initialized',
    simulation: isSimulationRunning ? 'running' : 'stopped'
  });
});

// Initialize and start server
const PORT = process.env.PORT || 3002;

initializeFramework();

server.listen(PORT, () => {
  console.log(`🚀 Health Agent Kit API Server running on http://localhost:${PORT}`);
  console.log(`🌐 WebSocket server ready for real-time updates`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/agents - List all agents`);
  console.log(`   POST /api/patients/generate - Generate patient`);
  console.log(`   GET  /api/environment - Environment state`);
  console.log(`   POST /api/simulation/start - Start simulation`);
  console.log(`   GET  /api/performance - Performance metrics`);
});

export default app; 