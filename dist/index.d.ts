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
export * from '@/types/core.types';
export { BaseAgent } from '@/core/base.agent';
export { BaseEnvironment } from '@/core/base.environment';
export * from '@/environments/triage.environment';
export * from '@/agents/rule-based.agent';
export * from '@/simulation/simulation.engine';
export declare function runTriageSimulation(): Promise<void>;
export declare function quickStart(): Promise<void>;
declare const _default: {
    runTriageSimulation: typeof runTriageSimulation;
    quickStart: typeof quickStart;
    TriageEnvironment: typeof TriageEnvironment;
    RuleBasedTriageAgent: typeof RuleBasedTriageAgent;
    SimulationEngine: typeof SimulationEngine;
};
export default _default;
//# sourceMappingURL=index.d.ts.map