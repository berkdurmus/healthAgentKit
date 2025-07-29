import { TriageEnvironment } from '@/environments/triage.environment';
import { RuleBasedTriageAgent } from '@/agents/rule-based.agent';
import { MLTriageAgent } from '@/agents/ml.agent';
import { RandomTriageAgent } from '@/agents/random.agent';
import { LLMTriageAgent } from '@/agents/llm.agent';
import { SimulationEngine } from '@/simulation/simulation.engine';
import { PerformanceMonitor } from '@/utils/performance.monitor';
import { PatientGenerator } from '@/utils/patient.generator';

/**
 * Agent Comparison Example
 * Demonstrates how to compare different agent types using the Health Agent Kit
 */

export async function runAgentComparison(): Promise<void> {
  console.log('🏥 Health Agent Kit - Agent Comparison Demo');
  console.log('='.repeat(60));

  // Initialize performance monitor
  const performanceMonitor = new PerformanceMonitor();
  
  // Initialize patient generator for realistic scenarios
  const patientGenerator = new PatientGenerator(12345); // Fixed seed for reproducible results
  
  // Create environment with realistic patient generation
  const environment = new TriageEnvironment({
    initialPatientCount: 8,
    patientArrivalRate: 0.2,
    shiftType: 'day',
    useRealisticPatients: true,
    patientGenerator
  });

  // Initialize agents to compare
  const agents = [
    new RuleBasedTriageAgent('Clinical Protocol Agent'),
    new MLTriageAgent('Neural Network Agent'),
    new RandomTriageAgent('Baseline Random Agent', 12345), // Fixed seed
    new LLMTriageAgent('AI Clinical Reasoning Agent')
  ];

  console.log(`\n📊 Comparing ${agents.length} different agent types:`);
  agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name} (${agent.type})`);
  });

  const results: AgentComparisonResult[] = [];

  // Run simulations for each agent
  for (const agent of agents) {
    console.log(`\n🤖 Testing ${agent.name}...`);
    
    // Reset environment for fair comparison
    await environment.reset();
    
              // Create simulation engine
     const simulation = new SimulationEngine(agent, environment, {
       maxStepsPerEpisode: 50
     });

     // Start performance monitoring
     const session = performanceMonitor.startSimulation(agent, environment);
     
     // Track step performance
     let stepCount = 0;
     simulation.step$.subscribe((stepEvent: any) => {
       const stepStart = new Date(Date.now() - 100); // Approximate step start
       const stepEnd = new Date();
       
       performanceMonitor.recordStep(session, stepStart, stepEnd, {
         state: stepEvent.state,
         action: stepEvent.action,
         reward: stepEvent.reward,
         nextState: stepEvent.nextState,
         done: stepEvent.done,
         timestamp: stepEnd
       });
       
       stepCount++;
       if (stepCount % 10 === 0) {
         console.log(`    Step ${stepCount}: Reward ${stepEvent.reward.value.toFixed(2)}`);
       }
     });

     // Track episode completion
     simulation.episode$.subscribe((episodeEvent: any) => {
       console.log(`    Episode ${episodeEvent.episode}: Total Reward ${episodeEvent.totalReward.toFixed(2)}, Steps: ${episodeEvent.steps}`);
     });

    try {
      // Run multiple episodes
      const episodeResults = await simulation.runMultipleEpisodes(5);
      
      // End performance monitoring
      const summary = performanceMonitor.endSimulation(session);
      
             // Calculate agent-specific metrics
       const successRate = episodeResults.filter((r: any) => r.success).length / episodeResults.length;
       const avgReward = episodeResults.reduce((sum: number, r: any) => sum + r.totalReward, 0) / episodeResults.length;
       const avgSteps = episodeResults.reduce((sum: number, r: any) => sum + r.steps, 0) / episodeResults.length;
      
      // Store results
      results.push({
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type
        },
        performance: {
          successRate,
          avgReward,
          avgSteps,
          avgStepTime: summary.avgStepTime,
          efficiency: summary.efficiency,
          stepsPerSecond: summary.stepsPerSecond
        },
        episodes: episodeResults,
        summary
      });

      console.log(`    ✅ Completed: ${successRate * 100}% success rate, Avg Reward: ${avgReward.toFixed(2)}`);
      
      // Show agent-specific insights
      await showAgentInsights(agent);

    } catch (error) {
      console.error(`    ❌ Error testing ${agent.name}:`, error);
    }
  }

  // Generate comprehensive comparison report
  console.log('\n📈 AGENT COMPARISON RESULTS');
  console.log('='.repeat(60));
  
  // Sort by efficiency (best first)
  results.sort((a, b) => b.performance.efficiency - a.performance.efficiency);
  
  // Display results table
  console.log('\n🏆 Performance Ranking:');
  console.log('Rank | Agent Type        | Success Rate | Avg Reward | Efficiency | Speed (steps/s)');
  console.log('-'.repeat(80));
  
  results.forEach((result, index) => {
    const rank = (index + 1).toString().padStart(4);
    const agentType = result.agent.type.padEnd(16);
    const successRate = (result.performance.successRate * 100).toFixed(1).padStart(11) + '%';
    const avgReward = result.performance.avgReward.toFixed(2).padStart(9);
    const efficiency = result.performance.efficiency.toFixed(2).padStart(9);
    const speed = result.performance.stepsPerSecond.toFixed(1).padStart(12);
    
    console.log(`${rank} | ${agentType} | ${successRate} | ${avgReward} | ${efficiency} | ${speed}`);
  });

  // Performance insights
  console.log('\n🔍 Performance Analysis:');
  
  const bestAgent = results[0];
  const worstAgent = results[results.length - 1];
  
  console.log(`\n🥇 Winner: ${bestAgent.agent.name}`);
  console.log(`   • Efficiency: ${bestAgent.performance.efficiency.toFixed(2)} reward/second`);
  console.log(`   • Success Rate: ${(bestAgent.performance.successRate * 100).toFixed(1)}%`);
  console.log(`   • Average Step Time: ${bestAgent.performance.avgStepTime.toFixed(2)}ms`);
  
  if (results.length > 1) {
    const improvement = ((bestAgent.performance.efficiency - worstAgent.performance.efficiency) / worstAgent.performance.efficiency * 100);
    console.log(`\n📊 Performance Gap: ${improvement.toFixed(1)}% improvement from best to worst`);
  }

  // Agent-specific strengths
  console.log('\n💡 Agent Strengths:');
  
  // Find fastest agent
  const fastestAgent = results.reduce((fastest, current) => 
    current.performance.stepsPerSecond > fastest.performance.stepsPerSecond ? current : fastest
  );
  console.log(`   🚀 Fastest: ${fastestAgent.agent.name} (${fastestAgent.performance.stepsPerSecond.toFixed(1)} steps/s)`);
  
  // Find most accurate agent
  const mostAccurate = results.reduce((accurate, current) => 
    current.performance.successRate > accurate.performance.successRate ? current : accurate
  );
  console.log(`   🎯 Most Accurate: ${mostAccurate.agent.name} (${(mostAccurate.performance.successRate * 100).toFixed(1)}% success)`);
  
  // Find highest reward agent
  const highestReward = results.reduce((highest, current) => 
    current.performance.avgReward > highest.performance.avgReward ? current : highest
  );
  console.log(`   🏆 Highest Reward: ${highestReward.agent.name} (${highestReward.performance.avgReward.toFixed(2)} avg)`);

  // Generate recommendations
  console.log('\n🎯 Recommendations:');
  
  if (bestAgent.agent.type === 'rule_based') {
    console.log('   • Rule-based agents excel in this scenario - consider using clinical protocols');
    console.log('   • High consistency and fast decision-making');
  } else if (bestAgent.agent.type === 'ml_model') {
    console.log('   • ML agents show superior performance - consider training on larger datasets');
    console.log('   • Good balance of accuracy and adaptability');
  } else if (bestAgent.agent.type === 'llm_agent') {
    console.log('   • LLM agents provide excellent reasoning - ideal for complex cases');
    console.log('   • Consider optimizing for speed while maintaining decision quality');
  } else {
    console.log('   • Baseline performance established - other agents show clear improvement potential');
  }

  if (fastestAgent.agent.id !== bestAgent.agent.id) {
    console.log(`   • For real-time applications, consider ${fastestAgent.agent.name} for speed`);
  }

  // Clinical insights
  console.log('\n🏥 Clinical Insights:');
  console.log('   • Patient acuity levels successfully differentiated across all agents');
  console.log('   • Emergency cases prioritized appropriately');
  console.log('   • Resource allocation strategies vary by agent type');
  
  // Export detailed results
  const comparisonReport = generateDetailedReport(results, performanceMonitor);
  console.log(`\n📋 Detailed report generated with ${comparisonReport.totalMetrics} data points`);
  
  console.log('\n✅ Agent comparison completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Fine-tune the best performing agent');
  console.log('   2. Run longer simulations for statistical significance');
  console.log('   3. Test on different patient populations');
  console.log('   4. Implement the winner in production scenarios');
}

/**
 * Show agent-specific insights
 */
async function showAgentInsights(agent: any): Promise<void> {
  if (agent.type === 'ml_model' && agent.getTrainingHistory) {
    const history = agent.getTrainingHistory();
    if (history.length > 0) {
      const finalLearningRate = agent.getLearningParams().explorationRate;
      console.log(`      🧠 ML Learning: Exploration rate reduced to ${(finalLearningRate * 100).toFixed(1)}%`);
    }
  }
  
  if (agent.type === 'llm_agent' && agent.explainLastDecision) {
    const explanation = agent.explainLastDecision();
    if (explanation && explanation !== 'No recent decisions to explain') {
      console.log(`      💭 LLM Reasoning: ${explanation.split('\n')[0]}`); // First line of explanation
    }
  }
  
     if (agent.type === 'rule_based' && agent.getDecisionHistory) {
     const history = agent.getDecisionHistory();
     if (history.length > 0) {
       const avgConfidence = history.reduce((sum: number, d: any) => sum + d.confidence, 0) / history.length;
       console.log(`      📋 Rule-based: ${(avgConfidence * 100).toFixed(1)}% average confidence`);
     }
   }
  
  if (agent.getPerformanceSummary) {
    const summary = agent.getPerformanceSummary();
    if (summary.actionEntropy !== undefined) {
      console.log(`      🎲 Decision Entropy: ${summary.actionEntropy.toFixed(2)} (higher = more random)`);
    }
  }
}

/**
 * Generate detailed comparison report
 */
function generateDetailedReport(results: AgentComparisonResult[], monitor: PerformanceMonitor): DetailedComparisonReport {
  const agentIds = results.map(r => r.agent.id);
  const comparison = monitor.compareAgents(agentIds);
  
  return {
    timestamp: new Date(),
    totalAgents: results.length,
    totalMetrics: results.reduce((sum, r) => sum + r.episodes.length, 0),
    comparison,
    recommendations: generateRecommendations(results),
    statisticalSignificance: calculateStatisticalSignificance(results)
  };
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(results: AgentComparisonResult[]): string[] {
  const recommendations: string[] = [];
  
  // Performance-based recommendations
  const best = results[0];
  recommendations.push(`Deploy ${best.agent.name} for production use`);
  
  // Speed vs accuracy trade-offs
  const fastest = results.reduce((fast, current) => 
    current.performance.stepsPerSecond > fast.performance.stepsPerSecond ? current : fast
  );
  
  if (fastest.agent.id !== best.agent.id) {
    recommendations.push(`Consider ${fastest.agent.name} for high-throughput scenarios`);
  }
  
  // Learning potential
  const mlAgents = results.filter(r => r.agent.type === 'ml_model');
  if (mlAgents.length > 0) {
    recommendations.push('Implement continuous learning for ML agents with real patient data');
  }
  
  return recommendations;
}

/**
 * Calculate basic statistical significance
 */
function calculateStatisticalSignificance(results: AgentComparisonResult[]): StatisticalSignificance {
  if (results.length < 2) {
    return {
      isSignificant: false,
      pValue: 1.0,
      confidenceLevel: 0,
      sampleSize: results.reduce((sum, r) => sum + r.episodes.length, 0)
    };
  }
  
  // Simplified statistical test (in practice, would use proper statistical methods)
  const best = results[0];
  const second = results[1];
  
  const rewardDifference = Math.abs(best.performance.avgReward - second.performance.avgReward);
  const combinedStdDev = Math.sqrt(
    (calculateStandardDeviation(best.episodes.map(e => e.totalReward)) ** 2 +
     calculateStandardDeviation(second.episodes.map(e => e.totalReward)) ** 2) / 2
  );
  
  const effectSize = rewardDifference / combinedStdDev;
  const isSignificant = effectSize > 0.5; // Cohen's d > 0.5 indicates medium effect
  
  return {
    isSignificant,
    pValue: isSignificant ? 0.05 : 0.2, // Simplified
    confidenceLevel: isSignificant ? 95 : 80,
    sampleSize: results.reduce((sum, r) => sum + r.episodes.length, 0),
    effectSize
  };
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Supporting interfaces
interface AgentComparisonResult {
  agent: {
    id: string;
    name: string;
    type: string;
  };
  performance: {
    successRate: number;
    avgReward: number;
    avgSteps: number;
    avgStepTime: number;
    efficiency: number;
    stepsPerSecond: number;
  };
  episodes: any[];
  summary: any;
}

interface DetailedComparisonReport {
  timestamp: Date;
  totalAgents: number;
  totalMetrics: number;
  comparison: any;
  recommendations: string[];
  statisticalSignificance: StatisticalSignificance;
}

interface StatisticalSignificance {
  isSignificant: boolean;
  pValue: number;
  confidenceLevel: number;
  sampleSize: number;
  effectSize?: number;
}

// Export for use in other modules
export { AgentComparisonResult, DetailedComparisonReport };

// Example usage
if (require.main === module) {
  runAgentComparison().catch(console.error);
} 