import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory state for demo
let isSimulationRunning = false;
let currentEpisode = 0;
let connectedClients: WebSocket[] = [];

// Mock agent data that matches your framework structure
const mockAgents = [
  {
    id: 'rule-agent-1',
    name: 'Rule-Based Triage',
    type: 'RULE_BASED',
    status: 'active',
    description: 'Clinical protocol-based triage using ESI guidelines',
    capabilities: ['ESI Triage Protocol', 'Clinical Decision Trees', 'Risk Assessment', 'Priority Classification'],
    stats: { episodeCount: 0, totalSteps: 0, experienceCount: 0, isTraining: false },
    performance: {
      accuracy: 92.5,
      efficiency: 87.3,
      avgResponseTime: 2.4,
      patientsProcessed: 0,
      totalReward: 0,
      decisionConfidence: 94.2
    }
  },
  {
    id: 'ml-agent-1',
    name: 'ML Neural Network',
    type: 'ML_MODEL',
    status: 'training',
    description: 'Deep learning model with reinforcement learning for triage decisions',
    capabilities: ['Pattern Recognition', 'Adaptive Learning', 'Outcome Prediction', 'Risk Stratification'],
    stats: { episodeCount: 0, totalSteps: 0, experienceCount: 0, isTraining: true },
    performance: {
      accuracy: 94.1,
      efficiency: 91.8,
      avgResponseTime: 1.8,
      patientsProcessed: 0,
      totalReward: 0,
      decisionConfidence: 89.6,
      learningProgress: 78.2
    }
  },
  {
    id: 'llm-agent-1',
    name: 'LLM Clinical Agent',
    type: 'LLM_AGENT',
    status: 'active',
    description: 'Large language model with clinical reasoning and differential diagnosis',
    capabilities: ['Clinical Reasoning', 'Differential Diagnosis', 'Medical Knowledge Base', 'Symptom Analysis'],
    stats: { episodeCount: 0, totalSteps: 0, experienceCount: 0, isTraining: false },
    performance: {
      accuracy: 96.7,
      efficiency: 83.2,
      avgResponseTime: 4.2,
      patientsProcessed: 0,
      totalReward: 0,
      decisionConfidence: 91.8
    }
  },
  {
    id: 'random-agent-1',
    name: 'Random Baseline',
    type: 'RULE_BASED',
    status: 'paused',
    description: 'Random decision baseline for performance comparison',
    capabilities: ['Random Selection', 'Baseline Comparison'],
    stats: { episodeCount: 0, totalSteps: 0, experienceCount: 0, isTraining: false },
    performance: {
      accuracy: 54.3,
      efficiency: 45.1,
      avgResponseTime: 1.2,
      patientsProcessed: 0,
      totalReward: 0,
      decisionConfidence: 33.3
    }
  }
];

// Simple patient generator
function generatePatient() {
  const genders = ['Male', 'Female', 'Other'];
  const ethnicities = ['White', 'Black or African American', 'Hispanic or Latino', 'Asian', 'Other'];
  const chiefComplaints = [
    'Chest pain', 'Shortness of breath', 'Abdominal pain', 'Headache', 'Fever',
    'Back pain', 'Nausea and vomiting', 'Dizziness', 'Leg pain', 'Cough'
  ];
  const severities = ['Mild', 'Moderate', 'Severe', 'Critical'];
  const acuities = ['Low', 'Medium', 'High', 'Critical'];

  return {
    id: `patient-${Math.random().toString(36).substr(2, 9)}`,
    demographics: {
      age: Math.floor(Math.random() * 80) + 20,
      gender: genders[Math.floor(Math.random() * genders.length)],
      ethnicity: ethnicities[Math.floor(Math.random() * ethnicities.length)],
      language: 'English',
      insuranceType: ['Private', 'Medicare', 'Medicaid', 'Uninsured'][Math.floor(Math.random() * 4)],
      location: {
        address: `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city: 'Healthcare City',
        state: 'HC',
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
      }
    },
    medicalHistory: {
      conditions: ['Hypertension', 'Diabetes Type 2', 'Asthma'].slice(0, Math.floor(Math.random() * 3)),
      surgeries: ['Appendectomy', 'Gallbladder removal'].slice(0, Math.floor(Math.random() * 2)),
      hospitalizations: [],
      familyHistory: ['Heart disease', 'Cancer', 'Diabetes'].slice(0, Math.floor(Math.random() * 3))
    },
    currentCondition: {
      chiefComplaint: chiefComplaints[Math.floor(Math.random() * chiefComplaints.length)],
      symptoms: ['Pain', 'Discomfort', 'Swelling'].slice(0, Math.floor(Math.random() * 3) + 1),
      onset: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      severity: severities[Math.floor(Math.random() * severities.length)],
      acuity: acuities[Math.floor(Math.random() * acuities.length)],
      painLevel: Math.floor(Math.random() * 10) + 1
    },
    vitalSigns: {
      temperature: 98.6 + (Math.random() - 0.5) * 4,
      bloodPressure: {
        systolic: 120 + Math.floor(Math.random() * 40),
        diastolic: 80 + Math.floor(Math.random() * 20)
      },
      heartRate: 70 + Math.floor(Math.random() * 50),
      respiratoryRate: 16 + Math.floor(Math.random() * 8),
      oxygenSaturation: 96 + Math.floor(Math.random() * 4),
      timestamp: new Date()
    },
    socialDeterminants: {
      housing: 'Owned',
      employment: 'Employed',
      education: 'College Degree',
      transportation: 'Reliable',
      socialSupport: 'Strong',
      foodSecurity: 'Secure'
    },
    riskFactors: ['Smoking', 'High BMI'].slice(0, Math.floor(Math.random() * 2)),
    allergies: ['Penicillin', 'Latex'].slice(0, Math.floor(Math.random() * 2)),
    medications: ['Lisinopril', 'Metformin', 'Albuterol'].slice(0, Math.floor(Math.random() * 3))
  };
}

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('📱 Frontend connected via WebSocket');
  connectedClients.push(ws);
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    data: {
      agents: mockAgents,
      isRunning: isSimulationRunning,
      currentEpisode
    }
  }));
  
  ws.on('close', () => {
    console.log('📱 Frontend disconnected');
    connectedClients = connectedClients.filter(client => client !== ws);
  });
});

// Broadcast to all clients
function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agents: mockAgents.length,
    environment: 'emergency-dept-1',
    simulation: isSimulationRunning ? 'running' : 'stopped'
  });
});

app.get('/api/agents', (req, res) => {
  res.json(mockAgents);
});

app.get('/api/agents/:id', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

app.post('/api/patients/generate', (req, res) => {
  const patient = generatePatient();
  res.json(patient);
});

app.get('/api/patients/stats', (req, res) => {
  res.json({
    totalGenerated: 1247,
    averageAge: 54.3,
    genderDistribution: { male: 48.2, female: 49.1, other: 2.7 },
    severityDistribution: { mild: 32.1, moderate: 45.2, severe: 18.4, critical: 4.3 }
  });
});

app.get('/api/environment', (req, res) => {
  res.json({
    id: 'emergency-dept-1',
    name: 'Emergency Department',
    type: 'EMERGENCY_DEPARTMENT',
    currentState: {
      id: 'current-state',
      type: 'ACTIVE',
      data: { queueLength: Math.floor(Math.random() * 20) },
      timestamp: new Date(),
      isTerminal: false
    },
    stats: {
      totalEpisodes: currentEpisode,
      currentEpisodeSteps: 0,
      maxStepsPerEpisode: 100,
      isDone: false,
      startTime: new Date()
    }
  });
});

app.post('/api/simulation/start', (req, res) => {
  if (isSimulationRunning) {
    return res.status(400).json({ error: 'Simulation already running' });
  }
  
  isSimulationRunning = true;
  broadcast('SIMULATION_STARTED', { agentId: mockAgents[0].id });
  
  // Simulate episodes
  const runEpisodes = () => {
    if (!isSimulationRunning) return;
    
    currentEpisode++;
    
    // Update agent stats
    mockAgents.forEach(agent => {
      agent.stats.episodeCount++;
      agent.stats.totalSteps += Math.floor(Math.random() * 50) + 10;
      agent.performance.patientsProcessed = agent.stats.totalSteps;
    });
    
    broadcast('EPISODE_COMPLETE', {
      episode: currentEpisode,
      results: { totalReward: Math.random() * 100 }
    });
    
    // Schedule next episode
    setTimeout(runEpisodes, 2000);
  };
  
  // Start simulation loop
  setTimeout(runEpisodes, 1000);
  
  res.json({ message: 'Simulation started' });
});

app.post('/api/simulation/stop', (req, res) => {
  isSimulationRunning = false;
  broadcast('SIMULATION_STOPPED', {});
  res.json({ message: 'Simulation stopped' });
});

app.post('/api/simulation/reset', (req, res) => {
  isSimulationRunning = false;
  currentEpisode = 0;
  
  // Reset agent stats
  mockAgents.forEach(agent => {
    agent.stats.episodeCount = 0;
    agent.stats.totalSteps = 0;
    agent.performance.patientsProcessed = 0;
  });
  
  broadcast('SIMULATION_RESET', {});
  res.json({ message: 'Simulation reset' });
});

app.get('/api/performance', (req, res) => {
  res.json({
    realTimeMetrics: {
      activeAgents: mockAgents.filter(a => a.status === 'active').length,
      totalThroughput: 20 + Math.random() * 15,
      avgResponseTime: 2 + Math.random() * 3,
      successRate: 88 + Math.random() * 10,
      currentEpisode,
      queueLength: Math.floor(Math.random() * 20)
    },
    agentComparison: mockAgents.map(agent => ({
      agentName: agent.name,
      accuracy: agent.performance.accuracy,
      efficiency: agent.performance.efficiency,
      throughput: 15 + Math.random() * 20,
      totalReward: agent.performance.totalReward
    })),
    systemHealth: {
      cpuUsage: 30 + Math.random() * 40,
      memoryUsage: 50 + Math.random() * 30,
      networkLatency: 10 + Math.random() * 30,
      errorRate: Math.random() * 2
    }
  });
});

// Start server
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log('🚀 Health Agent Kit API Server (Simple Version) running on http://localhost:' + PORT);
  console.log('🌐 WebSocket server ready for real-time updates');
  console.log('📋 Available endpoints:');
  console.log('   GET  /api/health - Health check');
  console.log('   GET  /api/agents - List all agents');
  console.log('   POST /api/patients/generate - Generate patient');
  console.log('   POST /api/simulation/start - Start simulation');
  console.log('   GET  /api/performance - Performance metrics');
});

export default app; 