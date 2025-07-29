import { TriageEnvironment } from '@/environments/triage.environment';
import { RuleBasedTriageAgent } from '@/agents/rule-based.agent';
import { SimulationEngine } from '@/simulation/simulation.engine';

/**
 * Health Agent Kit - Main Entry Point
 * 
 * This demonstrates how to use the framework to create and run healthcare RL simulations.
 * 
 * Usage:
 * - npm run dev: Run development server with live reloading
 * - npm run build: Build the framework
 * - npm test: Run tests
 * - npm run web: Launch the web interface
 */

// Export main framework components
export * from '@/types/core.types';
export { BaseAgent } from '@/core/base.agent';
export { BaseEnvironment } from '@/core/base.environment';
export * from '@/environments/triage.environment';
export * from '@/agents/rule-based.agent';
export * from '@/agents/ml.agent';
export * from '@/agents/random.agent';
export * from '@/simulation/simulation.engine';
export * from '@/utils/patient.generator';
export * from '@/data/clinical.data';

// Example usage function
export async function runTriageSimulation(): Promise<void> {
  console.log('🏥 Health Agent Kit - Triage Simulation Demo');
  console.log('='.repeat(50));

  try {
    // Create triage environment
    console.log('📋 Creating Emergency Department Triage Environment...');
    const environment = new TriageEnvironment({
      initialPatientCount: 5,
      patientArrivalRate: 0.15,
      maxStepsPerEpisode: 100
    });

    // Create rule-based triage agent
    console.log('🤖 Creating Rule-Based Triage Agent...');
    const agent = new RuleBasedTriageAgent('Clinical Triage Agent');

    // Create simulation engine
    console.log('⚙️  Setting up Simulation Engine...');
    const simulation = new SimulationEngine(agent, environment, {
      maxStepsPerEpisode: 100,
      enableLogging: true,
      enableMetrics: true,
      successThreshold: 3.0 // Positive average reward indicates good performance
    });

    // Subscribe to simulation events for real-time monitoring
    simulation.step$.subscribe(stepEvent => {
      if (stepEvent.step % 10 === 0) { // Log every 10th step
        console.log(`   Step ${stepEvent.step}: Reward=${stepEvent.stepData.reward.value.toFixed(2)}, Confidence=${stepEvent.stepData.agentConfidence.toFixed(2)}`);
      }
    });

    simulation.episode$.subscribe(episodeEvent => {
      const result = episodeEvent.result;
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Episode ${episodeEvent.episode}: ${result.steps.length} steps, Total Reward: ${result.totalReward.toFixed(2)}, Avg Reward: ${result.averageReward.toFixed(2)}`);
    });

    // Run simulation episodes
    console.log('\n🚀 Running Simulation Episodes...');
    console.log('-'.repeat(50));
    
    const results = await simulation.runMultipleEpisodes(5);
    
    // Print summary
    console.log('\n📊 Simulation Summary');
    console.log('-'.repeat(50));
    
    const summary = simulation.getPerformanceSummary();
    console.log(`Total Episodes: ${summary.totalEpisodes}`);
    console.log(`Success Rate: ${(summary.successRate * 100).toFixed(1)}%`);
    console.log(`Average Reward: ${summary.averageReward.toFixed(2)}`);
    console.log(`Average Steps: ${summary.averageSteps.toFixed(1)}`);
    console.log(`Average Duration: ${summary.averageDuration.toFixed(0)}ms`);

    // Show environment metrics
    const envMetrics = environment.getMetrics();
    console.log('\n🏥 Environment Metrics');
    console.log('-'.repeat(50));
    console.log(`Patients Processed: ${envMetrics.throughput.toFixed(1)}/hour`);
    console.log(`Average Wait Time: ${envMetrics.averageWaitTime.toFixed(1)} minutes`);
    console.log(`Patient Satisfaction: ${(envMetrics.patientSatisfaction * 100).toFixed(1)}%`);
    console.log(`Cost per Patient: $${envMetrics.costPerPatient.toFixed(2)}`);
    console.log(`Safety Incidents: ${envMetrics.safetyIncidents}`);

    // Show agent performance
    const agentStats = agent.getStats();
    console.log('\n🤖 Agent Performance');
    console.log('-'.repeat(50));
    console.log(`Episodes: ${agentStats.episodeCount}`);
    console.log(`Total Steps: ${agentStats.totalSteps}`);
    console.log(`Experience Count: ${agentStats.experienceCount}`);
    console.log(`Training Mode: ${agentStats.isTraining ? 'Yes' : 'No'}`);

    // Show sample decisions
    const decisions = agent.getDecisionHistory().slice(-3);
    if (decisions.length > 0) {
      console.log('\n📋 Recent Triage Decisions');
      console.log('-'.repeat(50));
      decisions.forEach((decision, index) => {
        console.log(`${index + 1}. Patient ${decision.patientId}: Priority ${decision.assignedPriority} (${(decision.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   Reasoning: ${decision.reasoning}`);
      });
    }

    console.log('\n✨ Simulation Complete! Use npm run web to view results in the dashboard.');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Quick start function for CLI usage
export async function quickStart(): Promise<void> {
  await runTriageSimulation();
}

// Default export for module usage
export default {
  runTriageSimulation,
  quickStart,
  TriageEnvironment,
  RuleBasedTriageAgent,
  SimulationEngine
};

// Auto-run if this is the main module
if (require.main === module) {
  quickStart().catch(console.error);
} 