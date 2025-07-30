// Core components
export * from "@/core/base.agent";
export * from "@/core/base.environment";

// New Active Learning Core
export * from "@/core/active.learning";
export * from "@/core/expert.feedback";

// Agents
export * from "@/agents/llm.agent";
export * from "@/agents/ml.agent";
export * from "@/agents/random.agent";
export * from "@/agents/rule-based.agent";

// Enhanced Active Learning Agents
export * from "@/agents/active.ml.agent";
export * from "@/agents/active.llm.agent";

// Environments
export * from "@/environments/triage.environment";

// Simulation engines
export * from "@/simulation/simulation.engine";
export * from "@/simulation/active.simulation.engine";

// Analytics and monitoring
export * from "@/analytics/active.learning.analytics";

// Types
export * from "@/types/core.types";

// Utilities
export * from "@/utils/patient.generator";
export * from "@/utils/performance.monitor";
export * from "@/utils/active.patient.selector";

// Data
export * from "@/data/clinical.data";

// Examples
export * from "@/examples/agent.comparison";

// Active Reinforcement Learning demonstration
export async function runActiveTriageSimulation(): Promise<void> {
  console.log("🚀 Health Agent Kit - Active Reinforcement Learning Demo");
  console.log("=".repeat(60));

  try {
    // Import necessary components
    const { TriageEnvironment } = await import(
      "@/environments/triage.environment"
    );
    const { ActiveMLTriageAgent } = await import("@/agents/active.ml.agent");
    const { ActiveLLMTriageAgent } = await import("@/agents/active.llm.agent");
    const { ActiveSimulationEngine } = await import(
      "@/simulation/active.simulation.engine"
    );
    const { ActiveLearningAnalytics } = await import(
      "@/analytics/active.learning.analytics"
    );
    const { CurriculumStrategy } = await import("@/core/active.learning");

    // Create triage environment
    console.log("🏥 Creating Emergency Department Triage Environment...");
    const environment = new TriageEnvironment({
      initialPatientCount: 8,
      patientArrivalRate: 0.2,
      maxStepsPerEpisode: 150,
    });

    // Create active learning ML agent
    console.log("🤖 Creating Active ML Triage Agent...");
    const mlAgent = new ActiveMLTriageAgent("Active ML Clinical Agent");

    // Create active learning LLM agent
    console.log("🧠 Creating Active LLM Triage Agent...");
    const llmAgent = new ActiveLLMTriageAgent("Active LLM Clinical Agent");

    // Create active simulation engine with comprehensive configuration
    console.log("⚙️  Setting up Active Learning Simulation Engine...");
    const activeSimulation = new ActiveSimulationEngine(mlAgent, environment, {
      maxStepsPerEpisode: 150,
      enableLogging: true,
      enableMetrics: true,
      successThreshold: 4.0,

      // Active learning configuration
      enableActiveLearning: true,
      enableCurriculum: true,
      enableExpertConsultation: true,
      enablePatientSelection: true,

      // Curriculum settings
      curriculumStrategy: CurriculumStrategy.ADAPTIVE,
      curriculumLevels: 5,
      adaptationFrequency: 15,

      // Patient selection
      patientsPerEpisode: 6,

      // Expert consultation
      expertConsultationBudget: 3,
      expertResponseTimeout: 300000,

      // Learning optimization
      uncertaintyThreshold: 0.65,
      informationGainThreshold: 0.5,
    });

    // Initialize analytics system
    const analytics = new ActiveLearningAnalytics({
      windowSize: 50,
      smoothingFactor: 0.1,
      significanceThreshold: 0.05,
    });

    // Initialize curriculum learning
    console.log("📚 Initializing Adaptive Curriculum Learning...");
    activeSimulation.initializeCurriculum(CurriculumStrategy.ADAPTIVE, 5);

    // Subscribe to learning events for real-time monitoring
    activeSimulation.learning$.subscribe((event) => {
      switch (event.type) {
        case "curriculum_advanced":
          console.log(
            `📈 Curriculum advanced to level ${event.data.toLevel}/${event.data.maxLevel}`
          );
          break;
        case "expert_consultation_requested":
          console.log(
            `👨‍⚕️ Expert consultation requested: ${event.data.questionType}`
          );
          break;
        case "active_query_generated":
          console.log(
            `🎯 Active query generated: ${
              event.data.queryType
            } (benefit: ${event.data.expectedBenefit.toFixed(2)})`
          );
          break;
      }
    });

    // Subscribe to episode events
    activeSimulation.episode$.subscribe((episodeEvent) => {
      const result = episodeEvent.result;
      const status = result.success ? "✅" : "❌";
      const learning = result.activeLearningMetrics;

      console.log(
        `${status} Episode ${episodeEvent.episode}: ${
          result.steps.length
        } steps, Reward: ${result.totalReward.toFixed(2)}`
      );
      console.log(
        `   📊 Learning: Queries=${learning.totalActiveQueries}, Experts=${
          learning.expertConsultationsUsed
        }, Efficiency=${learning.learningEfficiency.toFixed(2)}`
      );
      console.log(
        `   🧠 Uncertainty: Avg=${result.uncertaintyAnalysis.averageUncertainty.toFixed(
          2
        )}, Reduction=${result.uncertaintyAnalysis.uncertaintyReduction.toFixed(
          2
        )}`
      );
      console.log(
        `   🎓 Curriculum: Level=${
          result.curriculumProgress.currentLevel
        }, Progress=${(result.curriculumProgress.progressInLevel * 100).toFixed(
          1
        )}%`
      );

      // Add episode data to analytics
      analytics.addEpisodeData(result, episodeEvent.metrics);
    });

    // Start the simulation
    console.log("\n🚀 Running Active Learning Episodes...");
    console.log("-".repeat(60));

    activeSimulation.start();
    const results = await activeSimulation.runMultipleActiveEpisodes(10);

    // Generate comprehensive analytics
    console.log("\n📊 Generating Active Learning Analytics...");
    console.log("-".repeat(60));

    const learningAnalytics = analytics.generateAnalytics();

    // Print summary
    console.log("\n🎯 Active Learning Summary");
    console.log("-".repeat(60));

    const insights = activeSimulation.getActiveLearningInsights();
    console.log(
      `📈 Total Episodes: ${insights.simulationMetrics.totalEpisodes}`
    );
    console.log(
      `🏆 Success Rate: ${(
        insights.simulationMetrics.successRate * 100
      ).toFixed(1)}%`
    );
    console.log(
      `⚡ Learning Velocity: ${insights.simulationMetrics.averageLearningVelocity.toFixed(
        3
      )}`
    );
    console.log(
      `🎯 Learning Efficiency: ${insights.simulationMetrics.learningEfficiency.toFixed(
        3
      )}`
    );
    console.log(
      `❓ Active Queries Used: ${insights.simulationMetrics.totalActiveQueries}`
    );
    console.log(
      `👨‍⚕️ Expert Consultations: ${insights.simulationMetrics.totalExpertConsultations}`
    );
    console.log(
      `📚 Curriculum Progress: ${
        insights.curriculumProgress?.currentLevel || 0
      }/${insights.curriculumProgress?.maxLevel || 5}`
    );

    // Show key analytics insights
    console.log("\n🔍 Key Learning Insights");
    console.log("-".repeat(60));
    console.log(
      `📊 Performance Trend: ${learningAnalytics.performanceTrajectory.rewardProgression.trend}`
    );
    console.log(
      `🎯 Uncertainty Management: ${(
        learningAnalytics.uncertaintyEvolution.uncertaintyCalibration * 100
      ).toFixed(1)}% calibrated`
    );
    console.log(
      `💡 Query Effectiveness: ${(
        learningAnalytics.activeQueryEffectiveness.averageQueryBenefit * 100
      ).toFixed(1)}%`
    );
    console.log(
      `👨‍⚕️ Expert Utilization: ${
        insights.expertSystemMetrics.expertUtilization > 0
          ? "Active"
          : "Minimal"
      }`
    );

    // Show top recommendations
    console.log("\n💡 Optimization Recommendations");
    console.log("-".repeat(60));
    learningAnalytics.improvementRecommendations
      .slice(0, 3)
      .forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(
          `   Expected Impact: ${(rec.expectedImpact * 100).toFixed(1)}%`
        );
      });

    // Performance comparison with baseline
    if (learningAnalytics.baselineComparison.overallImprovement !== 0) {
      console.log("\n📈 Baseline Comparison");
      console.log("-".repeat(60));
      console.log(
        `🚀 Overall Improvement: ${(
          learningAnalytics.baselineComparison.overallImprovement * 100
        ).toFixed(1)}%`
      );
      console.log(
        `🤖 Active Learning Gain: ${(
          learningAnalytics.baselineComparison.activeLearningGain * 100
        ).toFixed(1)}%`
      );
      console.log(
        `👨‍⚕️ Expert Consultation Gain: ${(
          learningAnalytics.baselineComparison.expertConsultationGain * 100
        ).toFixed(1)}%`
      );
    }

    // System health assessment
    console.log("\n🏥 System Health");
    console.log("-".repeat(60));
    const health = insights.systemHealth;
    console.log(`🤖 Active Learning: ${health.activeLearningHealth}`);
    console.log(`📚 Curriculum: ${health.curriculumHealth}`);
    console.log(`👨‍⚕️ Expert System: ${health.expertSystemHealth}`);
    console.log(`🎯 Overall Health: ${health.overallHealth}`);

    console.log("\n🎉 Active Reinforcement Learning Demonstration Complete!");
    console.log("=".repeat(60));
    console.log("🔬 This demo showcased:");
    console.log("  ✅ Uncertainty-driven active exploration");
    console.log("  ✅ Expert consultation integration");
    console.log("  ✅ Adaptive curriculum learning");
    console.log("  ✅ Strategic patient selection");
    console.log("  ✅ Comprehensive learning analytics");
    console.log("  ✅ Real-time performance optimization");
  } catch (error) {
    console.error("❌ Error in active learning demonstration:", error);
  }
}

// Enhanced agent comparison with active learning
export async function runActiveAgentComparison(): Promise<void> {
  console.log("🤖 Active Learning Agent Comparison");
  console.log("=".repeat(50));

  try {
    const { TriageEnvironment } = await import(
      "@/environments/triage.environment"
    );
    const { RuleBasedTriageAgent } = await import("@/agents/rule-based.agent");
    const { MLTriageAgent } = await import("@/agents/ml.agent");
    const { ActiveMLTriageAgent } = await import("@/agents/active.ml.agent");
    const { ActiveLLMTriageAgent } = await import("@/agents/active.llm.agent");
    const { ActiveSimulationEngine } = await import(
      "@/simulation/active.simulation.engine"
    );

    const environment = new TriageEnvironment({
      initialPatientCount: 5,
      patientArrivalRate: 0.15,
      maxStepsPerEpisode: 100,
    });

    const agents = [
      new RuleBasedTriageAgent("Rule-Based"),
      new MLTriageAgent("Standard ML"),
      new ActiveMLTriageAgent("Active ML"),
      new ActiveLLMTriageAgent("Active LLM"),
    ];

    console.log("\n🏁 Running comparison episodes...");

    for (const agent of agents) {
      const simulation = new ActiveSimulationEngine(agent, environment, {
        enableActiveLearning: agent.name.includes("Active"),
        enableCurriculum: agent.name.includes("Active"),
        enableExpertConsultation: agent.name.includes("LLM"),
        maxStepsPerEpisode: 100,
      });

      console.log(`\n🤖 Testing ${agent.name}...`);
      const results = await simulation.runMultipleActiveEpisodes(5);

      const avgReward =
        results.reduce((sum, r) => sum + r.totalReward, 0) / results.length;
      const successRate =
        results.filter((r) => r.success).length / results.length;
      const avgLearningVelocity =
        results.reduce((sum, r) => sum + r.learningVelocity, 0) /
        results.length;

      console.log(`   📊 Average Reward: ${avgReward.toFixed(2)}`);
      console.log(`   ✅ Success Rate: ${(successRate * 100).toFixed(1)}%`);
      console.log(`   ⚡ Learning Velocity: ${avgLearningVelocity.toFixed(3)}`);

      if (agent.name.includes("Active")) {
        const totalQueries = results.reduce(
          (sum, r) => sum + r.activeLearningMetrics.totalActiveQueries,
          0
        );
        const totalConsultations = results.reduce(
          (sum, r) => sum + r.activeLearningMetrics.expertConsultationsUsed,
          0
        );
        console.log(`   🎯 Active Queries: ${totalQueries}`);
        console.log(`   👨‍⚕️ Expert Consultations: ${totalConsultations}`);
      }
    }

    console.log(
      "\n🏆 Active learning agents demonstrate enhanced performance through:"
    );
    console.log("  • Strategic uncertainty management");
    console.log("  • Expert knowledge integration");
    console.log("  • Adaptive curriculum progression");
    console.log("  • Intelligent patient selection");
  } catch (error) {
    console.error("❌ Error in agent comparison:", error);
  }
}

// Example usage function (maintain backward compatibility)
export async function runTriageSimulation(): Promise<void> {
  console.log("🏥 Health Agent Kit - Triage Simulation Demo");
  console.log("=".repeat(50));

  try {
    // Create triage environment
    console.log("📋 Creating Emergency Department Triage Environment...");
    const { TriageEnvironment } = await import(
      "@/environments/triage.environment"
    );
    const environment = new TriageEnvironment({
      initialPatientCount: 5,
      patientArrivalRate: 0.15,
      maxStepsPerEpisode: 100,
    });

    // Create rule-based triage agent
    console.log("🤖 Creating Rule-Based Triage Agent...");
    const { RuleBasedTriageAgent } = await import("@/agents/rule-based.agent");
    const agent = new RuleBasedTriageAgent("Clinical Triage Agent");

    // Create simulation engine
    console.log("⚙️  Setting up Simulation Engine...");
    const { SimulationEngine } = await import("@/simulation/simulation.engine");
    const simulation = new SimulationEngine(agent, environment, {
      maxStepsPerEpisode: 100,
      enableLogging: true,
      enableMetrics: true,
      successThreshold: 3.0, // Positive average reward indicates good performance
    });

    // Subscribe to simulation events for real-time monitoring
    simulation.step$.subscribe((stepEvent) => {
      if (stepEvent.step % 10 === 0) {
        // Log every 10th step
        console.log(
          `   Step ${
            stepEvent.step
          }: Reward=${stepEvent.stepData.reward.value.toFixed(
            2
          )}, Confidence=${stepEvent.stepData.agentConfidence.toFixed(2)}`
        );
      }
    });

    simulation.episode$.subscribe((episodeEvent) => {
      const result = episodeEvent.result;
      const status = result.success ? "✅" : "❌";
      console.log(
        `${status} Episode ${episodeEvent.episode}: ${
          result.steps.length
        } steps, Total Reward: ${result.totalReward.toFixed(
          2
        )}, Avg Reward: ${result.averageReward.toFixed(2)}`
      );
    });

    // Run simulation episodes
    console.log("\n🚀 Running Simulation Episodes...");
    console.log("-".repeat(50));

    const results = await simulation.runMultipleEpisodes(5);

    // Print summary
    console.log("\n📊 Simulation Summary");
    console.log("-".repeat(50));

    const summary = simulation.getPerformanceSummary();
    console.log(`Total Episodes: ${summary.totalEpisodes}`);
    console.log(`Success Rate: ${(summary.successRate * 100).toFixed(1)}%`);
    console.log(`Average Reward: ${summary.averageReward.toFixed(2)}`);
    console.log(`Total Steps: ${summary.totalSteps || 0}`);
    console.log(`Agent Experience Count: ${summary.agentExperienceCount || 0}`);

    console.log("\n🎉 Basic simulation complete!");
    console.log(
      "💡 Try runActiveTriageSimulation() for advanced active learning features!"
    );
  } catch (error) {
    console.error("❌ Error in simulation:", error);
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
  SimulationEngine,
};

// Auto-run if this is the main module
if (require.main === module) {
  quickStart().catch(console.error);
}
