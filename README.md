# 🏥 Health Agent Kit

> TypeScript framework for healthcare reinforcement learning agents - simulating clinical workflows, triage, and care pathways

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Health Agent Kit is a comprehensive TypeScript framework designed to simulate and evaluate reinforcement learning agents in healthcare scenarios. It provides tools for creating clinical environments, implementing agent policies, and analyzing healthcare workflow optimization.

### Key Features

- 🏥 **Clinical Environment Simulation** - Emergency departments, primary care, specialist clinics
- 🤖 **Multiple Agent Types** - Rule-based, ML models, LLM agents, and hybrid approaches  
- 📊 **Comprehensive Metrics** - Patient outcomes, efficiency, safety, satisfaction, and cost tracking
- 🎯 **Reward Shaping** - Multi-objective optimization for healthcare-specific goals
- 📈 **Real-time Monitoring** - Web dashboard with live simulation visualization
- 🔄 **Extensible Architecture** - Easy to add new environments, agents, and evaluation metrics

## Quick Start

### Installation

```bash
git clone https://github.com/berkdurmus/health-agent-kit.git
cd healthAgentKit
npm install
```

### Run a Demo Simulation

```bash
# Run command-line simulation
npm run dev

# Or launch the web dashboard
npm run web
```

### Basic Example

```typescript
import { TriageEnvironment, RuleBasedTriageAgent, SimulationEngine } from 'health-agent-kit';

// Create environment
const environment = new TriageEnvironment({
  initialPatientCount: 5,
  patientArrivalRate: 0.15
});

// Create agent
const agent = new RuleBasedTriageAgent('Clinical Triage Agent');

// Run simulation
const simulation = new SimulationEngine(agent, environment);
const results = await simulation.runMultipleEpisodes(10);

console.log('Success Rate:', results.filter(r => r.success).length / results.length);
```

## Architecture

### Core Components

```
healthAgentKit/
├── src/
│   ├── types/           # Core type definitions and interfaces
│   ├── core/            # Base classes for agents and environments
│   ├── agents/          # Agent implementations (rule-based, ML, LLM)
│   ├── environments/    # Healthcare environment simulations
│   ├── simulation/      # Simulation engine and orchestration
│   └── utils/           # Utility functions and helpers
├── web/                 # Web dashboard for visualization
└── examples/            # Usage examples and demos
```

### Core Interfaces

#### Agent Interface
```typescript
interface Agent {
  selectAction(state: State, availableActions: Action[]): Promise<Action>;
  update(experience: Experience): Promise<void>;
  getConfidence(state: State, action: Action): number;
  reset(): void;
}
```

#### Environment Interface
```typescript
interface Environment {
  getCurrentState(): State;
  getAvailableActions(state?: State): Action[];
  step(action: Action): Promise<StepResult>;
  reset(): Promise<State>;
  isDone(): boolean;
  getMetrics(): EnvironmentMetrics;
}
```

## Healthcare Scenarios

### Emergency Department Triage

The framework includes a comprehensive triage environment that simulates:

- **Patient Arrivals** - Dynamic patient generation with realistic conditions
- **Triage Protocols** - Implementation of clinical decision rules (ESI, CTAS)
- **Resource Management** - Trauma bays, urgent care rooms, general beds
- **Multi-objective Optimization** - Balancing speed, accuracy, safety, and cost

```typescript
const triageEnv = new TriageEnvironment({
  initialPatientCount: 10,
  patientArrivalRate: 0.2,
  shiftType: 'day'
});
```

### Clinical Decision Support

Agents can implement various decision-making approaches:

- **Rule-based Agents** - Clinical guidelines and protocols
- **ML Agents** - Trained models for pattern recognition
- **LLM Agents** - Large language models with medical knowledge
- **Hybrid Agents** - Combining multiple approaches

## Agent Development

### Creating a Custom Agent

```typescript
import { BaseAgent, AgentType, State, Action } from 'health-agent-kit';

export class MyCustomAgent extends BaseAgent {
  constructor() {
    super('My Custom Agent', AgentType.ML_MODEL);
  }

  async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    // Implement your decision logic
    return this.chooseOptimalAction(state, availableActions);
  }

  async update(experience: Experience): Promise<void> {
    // Implement learning from experience
    this.updatePolicy(experience);
  }

  getConfidence(state: State, action: Action): number {
    // Return confidence score (0-1)
    return this.calculateConfidence(state, action);
  }
}
```

### Rule-based Agent Example

```typescript
const rules = [
  {
    condition: (patient) => patient.vitalSigns.heartRate > 150,
    priority: TriagePriority.IMMEDIATE,
    reasoning: 'Critical tachycardia requires immediate attention'
  },
  {
    condition: (patient) => patient.currentCondition.painLevel >= 8,
    priority: TriagePriority.URGENT,  
    reasoning: 'High pain level requires urgent assessment'
  }
];

const agent = new RuleBasedTriageAgent('Clinical Protocol Agent');
```

## Environment Development

### Creating a Custom Environment

```typescript
import { BaseEnvironment, EnvironmentType, State, Action } from 'health-agent-kit';

export class PrimaryCareEnvironment extends BaseEnvironment {
  constructor(config = {}) {
    super('Primary Care Clinic', EnvironmentType.PRIMARY_CARE, config);
  }

  getAvailableActions(state?: State): Action[] {
    // Return available actions based on current state
    return this.generateActions(state);
  }

  async step(action: Action): Promise<StepResult> {
    // Execute action and return new state + reward
    return this.processAction(action);
  }

  async reset(): Promise<State> {
    // Reset environment to initial state
    return this.initializeEnvironment();
  }
}
```

## Metrics and Evaluation

### Healthcare-Specific Metrics

The framework tracks comprehensive metrics aligned with healthcare quality indicators:

```typescript
interface EnvironmentMetrics {
  throughput: number;              // Patients per hour
  averageWaitTime: number;         // Minutes
  patientSatisfaction: number;     // 0-1 scale
  resourceUtilization: Record<string, number>;
  costPerPatient: number;          // USD
  safetyIncidents: number;         // Count
}
```

### Reward Components

Multi-objective reward functions consider:

- **Patient Outcomes** - Clinical effectiveness and safety
- **Efficiency** - Throughput and wait times  
- **Safety** - Incident prevention and risk mitigation
- **Satisfaction** - Patient and staff experience
- **Cost** - Resource utilization and financial impact
- **Compliance** - Adherence to protocols and regulations

```typescript
const reward: Reward = {
  value: 8.5,
  components: [
    { name: 'triage_accuracy', value: 9.0, weight: 0.4, category: 'patient_outcomes' },
    { name: 'efficiency', value: 7.5, weight: 0.3, category: 'efficiency' },
    { name: 'safety', value: 10.0, weight: 0.3, category: 'safety' }
  ],
  reasoning: 'Excellent triage decision with high accuracy and safety'
};
```

## Web Dashboard

The included web dashboard provides real-time visualization of:

- **Simulation Controls** - Start, pause, stop, and reset simulations
- **Live Metrics** - Real-time updates of key performance indicators
- **Environment Status** - Patient queue, resource availability, wait times
- **Agent Performance** - Decision accuracy, confidence levels, learning progress
- **Activity Logs** - Detailed event history and decision explanations

Launch the dashboard:

```bash
npm run web
```

## API Documentation

### Core Classes

#### SimulationEngine

Main orchestration class for running simulations:

```typescript
const engine = new SimulationEngine(agent, environment, {
  maxStepsPerEpisode: 100,
  enableLogging: true,
  successThreshold: 5.0
});

// Run single episode
const result = await engine.runEpisode();

// Run multiple episodes  
const results = await engine.runMultipleEpisodes(50);

// Get performance summary
const summary = engine.getPerformanceSummary();
```

#### BaseAgent

Abstract base class for all agents:

```typescript
class MyAgent extends BaseAgent {
  // Implement required methods
  async selectAction(state, actions) { /* ... */ }
  async update(experience) { /* ... */ }
  getConfidence(state, action) { /* ... */ }
}
```

#### BaseEnvironment  

Abstract base class for all environments:

```typescript
class MyEnvironment extends BaseEnvironment {
  // Implement required methods
  getAvailableActions(state) { /* ... */ }
  async step(action) { /* ... */ }
  async reset() { /* ... */ }
}
```

## Examples

### Comparing Agent Performance

```typescript
const environment = new TriageEnvironment();
const agents = [
  new RuleBasedTriageAgent('Rule-Based'),
  new MLTriageAgent('ML-Model'), 
  new LLMTriageAgent('GPT-4')
];

for (const agent of agents) {
  const simulation = new SimulationEngine(agent, environment);
  const results = await simulation.runMultipleEpisodes(100);
  
  console.log(`${agent.name}:`, {
    successRate: results.filter(r => r.success).length / results.length,
    avgReward: results.reduce((sum, r) => sum + r.totalReward, 0) / results.length,
    avgSteps: results.reduce((sum, r) => sum + r.steps.length, 0) / results.length
  });
}
```

### Curriculum Learning

```typescript
const curriculum = [
  { episodes: 50, difficulty: 'easy', patientCount: 3 },
  { episodes: 100, difficulty: 'medium', patientCount: 7 },
  { episodes: 200, difficulty: 'hard', patientCount: 15 }
];

for (const stage of curriculum) {
  const env = new TriageEnvironment({ 
    initialPatientCount: stage.patientCount 
  });
  
  const simulation = new SimulationEngine(agent, env);
  await simulation.runMultipleEpisodes(stage.episodes);
  
  console.log(`Completed ${stage.difficulty} stage`);
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build the framework
npm run build
```

### Creating New Environments

1. Extend `BaseEnvironment`
2. Implement required abstract methods
3. Add comprehensive tests
4. Update documentation

### Creating New Agents

1. Extend `BaseAgent` 
2. Implement decision logic in `selectAction`
3. Add learning capabilities in `update`
4. Include confidence estimation
5. Add comprehensive tests

## Roadmap

- [ ] **Additional Environments**
  - ICU workflow simulation
  - Surgical scheduling
  - Medication management
  - Care coordination

- [ ] **Advanced Agents**
  - Deep Q-Networks (DQN)
  - Policy gradient methods  
  - Multi-agent systems
  - Human-in-the-loop

- [ ] **Enhanced Analytics**
  - Statistical analysis tools
  - A/B testing framework
  - Performance benchmarking
  - Clinical outcome tracking

- [ ] **Integration**
  - FHIR data compatibility
  - EHR system integration
  - Real-time data streams
  - Cloud deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for healthcare innovation and improving patient outcomes
- Inspired by clinical decision support systems and evidence-based medicine
- Designed with input from healthcare professionals and researchers

## Support

- 📖 [Documentation](https://health-agent-kit.docs.com)
- 💬 [Community Forum](https://github.com/health-agent-kit/discussions)
- 🐛 [Issue Tracker](https://github.com/health-agent-kit/issues)
- 📧 [Email Support](mailto:support@health-agent-kit.com)

---

**Built with ❤️ for healthcare innovation** 