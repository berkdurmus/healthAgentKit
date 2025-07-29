import { 
  Agent, 
  Environment, 
  AgentType,
  EnvironmentType,
  Experience,
  State,
  Action
} from '@/types/core.types';

/**
 * Performance Monitor for Health Agent Kit
 * Tracks simulation performance, memory usage, and agent comparison metrics
 */
export class PerformanceMonitor {
  private sessionId: string;
  private startTime: Date;
  private measurements: PerformanceMeasurement[] = [];
  private agentMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private environmentMetrics: Map<string, EnvironmentPerformanceMetrics> = new Map();
  private memoryBaseline: number;
  
  constructor() {
    this.sessionId = `session-${Date.now()}`;
    this.startTime = new Date();
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Start monitoring a simulation
   */
  public startSimulation(agent: Agent, environment: Environment): SimulationSession {
    const sessionId = `sim-${Date.now()}`;
    const session: SimulationSession = {
      id: sessionId,
      agentId: agent.id,
      agentType: agent.type,
      environmentId: environment.id,
      environmentType: environment.type,
      startTime: new Date(),
      stepCount: 0,
      totalReward: 0,
      avgStepTime: 0,
      memoryUsage: this.getCurrentMemoryUsage()
    };

    this.log('info', 'Started simulation monitoring', {
      sessionId,
      agent: agent.name,
      environment: environment.name
    });

    return session;
  }

  /**
   * Record a simulation step performance
   */
  public recordStep(
    session: SimulationSession, 
    stepStartTime: Date, 
    stepEndTime: Date,
    experience: Experience
  ): void {
    const stepDuration = stepEndTime.getTime() - stepStartTime.getTime();
    
    // Update session metrics
    session.stepCount++;
    session.totalReward += experience.reward.value;
    session.avgStepTime = ((session.avgStepTime * (session.stepCount - 1)) + stepDuration) / session.stepCount;
    
    // Record detailed measurement
    const measurement: PerformanceMeasurement = {
      timestamp: stepEndTime,
      sessionId: session.id,
      type: 'step',
      duration: stepDuration,
      memoryUsage: this.getCurrentMemoryUsage(),
      metadata: {
        reward: experience.reward.value,
        actionType: experience.action.type,
        stepNumber: session.stepCount
      }
    };
    
    this.measurements.push(measurement);
    
    // Update agent metrics
    this.updateAgentMetrics(session.agentId, session.agentType, stepDuration, experience);
    
    // Periodic memory check
    if (session.stepCount % 100 === 0) {
      this.checkMemoryUsage(session);
    }
  }

  /**
   * Record episode completion
   */
  public recordEpisode(
    session: SimulationSession,
    episodeStartTime: Date,
    episodeEndTime: Date,
    episodeReward: number,
    stepCount: number
  ): void {
    const episodeDuration = episodeEndTime.getTime() - episodeStartTime.getTime();
    
    const measurement: PerformanceMeasurement = {
      timestamp: episodeEndTime,
      sessionId: session.id,
      type: 'episode',
      duration: episodeDuration,
      memoryUsage: this.getCurrentMemoryUsage(),
      metadata: {
        episodeReward,
        stepCount,
        avgStepTime: session.avgStepTime
      }
    };
    
    this.measurements.push(measurement);
    
    this.log('info', 'Episode completed', {
      sessionId: session.id,
      duration: episodeDuration,
      reward: episodeReward,
      steps: stepCount
    });
  }

  /**
   * End simulation monitoring
   */
  public endSimulation(session: SimulationSession): SimulationSummary {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - session.startTime.getTime();
    
    const summary: SimulationSummary = {
      sessionId: session.id,
      agentType: session.agentType,
      environmentType: session.environmentType,
      totalDuration,
      totalSteps: session.stepCount,
      totalReward: session.totalReward,
      avgReward: session.stepCount > 0 ? session.totalReward / session.stepCount : 0,
      avgStepTime: session.avgStepTime,
      stepsPerSecond: session.stepCount / (totalDuration / 1000),
      memoryGrowth: this.getCurrentMemoryUsage() - session.memoryUsage,
      efficiency: this.calculateEfficiency(session)
    };

    this.log('info', 'Simulation monitoring ended', summary);
    return summary;
  }

  /**
   * Compare performance between different agents
   */
  public compareAgents(agentIds: string[]): AgentComparison {
    const comparisons: AgentPerformanceComparison[] = [];
    
    for (const agentId of agentIds) {
      const metrics = this.agentMetrics.get(agentId);
      if (metrics) {
        comparisons.push({
          agentId,
          agentType: metrics.agentType,
          avgStepTime: metrics.totalStepTime / metrics.stepCount,
          avgReward: metrics.totalReward / metrics.stepCount,
          totalSteps: metrics.stepCount,
          errorRate: metrics.errorCount / metrics.stepCount,
          efficiency: metrics.totalReward / (metrics.totalStepTime / 1000) // reward per second
        });
      }
    }
    
    // Sort by efficiency (descending)
    comparisons.sort((a, b) => b.efficiency - a.efficiency);
    
    return {
      timestamp: new Date(),
      agentCount: comparisons.length,
      comparisons,
      winner: comparisons[0],
      insights: this.generateInsights(comparisons)
    };
  }

  /**
   * Get real-time performance metrics
   */
  public getRealTimeMetrics(): RealTimeMetrics {
    const recentMeasurements = this.measurements.slice(-100); // Last 100 measurements
    const currentMemory = this.getCurrentMemoryUsage();
    
    const avgStepTime = recentMeasurements
      .filter(m => m.type === 'step')
      .reduce((sum, m) => sum + m.duration, 0) / Math.max(1, recentMeasurements.length);
      
    const avgMemoryUsage = recentMeasurements
      .reduce((sum, m) => sum + m.memoryUsage, 0) / Math.max(1, recentMeasurements.length);

    return {
      timestamp: new Date(),
      sessionUptime: Date.now() - this.startTime.getTime(),
      currentMemoryUsage: currentMemory,
      memoryGrowthRate: this.calculateMemoryGrowthRate(),
      avgStepTime,
      totalMeasurements: this.measurements.length,
      activeAgents: this.agentMetrics.size,
      recentThroughput: this.calculateRecentThroughput()
    };
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const metrics = this.getRealTimeMetrics();
    const agentComparison = this.compareAgents(Array.from(this.agentMetrics.keys()));
    
    return {
      sessionId: this.sessionId,
      generatedAt: new Date(),
      sessionDuration: metrics.sessionUptime,
      overallMetrics: metrics,
      agentComparison,
      recommendations: this.generateRecommendations(metrics, agentComparison),
      alerts: this.checkPerformanceAlerts(metrics)
    };
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): PerformanceExport {
    return {
      sessionId: this.sessionId,
      exportedAt: new Date(),
      measurements: [...this.measurements],
      agentMetrics: Object.fromEntries(this.agentMetrics),
      environmentMetrics: Object.fromEntries(this.environmentMetrics),
      summary: this.getRealTimeMetrics()
    };
  }

  // Private helper methods
  private getCurrentMemoryUsage(): number {
    // In a browser environment, this would use performance.memory
    // In Node.js, we can use process.memoryUsage()
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    
    // Fallback for browser or limited environments
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    return 0; // Unable to measure
  }

  private updateAgentMetrics(
    agentId: string, 
    agentType: AgentType, 
    stepDuration: number, 
    experience: Experience
  ): void {
    if (!this.agentMetrics.has(agentId)) {
      this.agentMetrics.set(agentId, {
        agentId,
        agentType,
        stepCount: 0,
        totalStepTime: 0,
        totalReward: 0,
        errorCount: 0,
        lastUpdate: new Date()
      });
    }
    
    const metrics = this.agentMetrics.get(agentId)!;
    metrics.stepCount++;
    metrics.totalStepTime += stepDuration;
    metrics.totalReward += experience.reward.value;
    metrics.lastUpdate = new Date();
    
    // Count errors (negative rewards below threshold)
    if (experience.reward.value < -10) {
      metrics.errorCount++;
    }
  }

  private checkMemoryUsage(session: SimulationSession): void {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryGrowth = currentMemory - this.memoryBaseline;
    
    if (memoryGrowth > 100) { // More than 100MB growth
      this.log('warn', 'High memory usage detected', {
        sessionId: session.id,
        currentMemory,
        growth: memoryGrowth,
        steps: session.stepCount
      });
    }
  }

  private calculateEfficiency(session: SimulationSession): number {
    // Efficiency = reward per unit time
    const totalTimeSeconds = (Date.now() - session.startTime.getTime()) / 1000;
    return session.totalReward / Math.max(1, totalTimeSeconds);
  }

  private calculateMemoryGrowthRate(): number {
    if (this.measurements.length < 10) return 0;
    
    const recent = this.measurements.slice(-10);
    const oldest = recent[0].memoryUsage;
    const newest = recent[recent.length - 1].memoryUsage;
    const timeSpan = recent[recent.length - 1].timestamp.getTime() - recent[0].timestamp.getTime();
    
    return ((newest - oldest) / Math.max(1, timeSpan / 1000)) * 1000; // MB per second
  }

  private calculateRecentThroughput(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentSteps = this.measurements.filter(
      m => m.type === 'step' && m.timestamp.getTime() > oneMinuteAgo
    );
    
    return recentSteps.length; // Steps per minute
  }

  private generateInsights(comparisons: AgentPerformanceComparison[]): string[] {
    const insights: string[] = [];
    
    if (comparisons.length === 0) return insights;
    
    const best = comparisons[0];
    const worst = comparisons[comparisons.length - 1];
    
    insights.push(`Best performing agent: ${best.agentType} with efficiency score of ${best.efficiency.toFixed(2)}`);
    
    if (comparisons.length > 1) {
      const improvementPotential = ((best.efficiency - worst.efficiency) / worst.efficiency * 100);
      insights.push(`Performance gap: ${improvementPotential.toFixed(1)}% difference between best and worst agents`);
    }
    
    // Find fastest agent
    const fastest = comparisons.reduce((min, agent) => 
      agent.avgStepTime < min.avgStepTime ? agent : min
    );
    insights.push(`Fastest decision making: ${fastest.agentType} (${fastest.avgStepTime.toFixed(2)}ms per step)`);
    
    // Find most accurate agent (lowest error rate)
    const mostAccurate = comparisons.reduce((min, agent) => 
      agent.errorRate < min.errorRate ? agent : min
    );
    insights.push(`Most accurate: ${mostAccurate.agentType} (${(mostAccurate.errorRate * 100).toFixed(1)}% error rate)`);
    
    return insights;
  }

  private generateRecommendations(
    metrics: RealTimeMetrics, 
    comparison: AgentComparison
  ): string[] {
    const recommendations: string[] = [];
    
    // Memory recommendations
    if (metrics.memoryGrowthRate > 1) {
      recommendations.push('Consider optimizing memory usage - growth rate exceeds 1MB/second');
    }
    
    // Performance recommendations
    if (metrics.avgStepTime > 1000) {
      recommendations.push('Step time is high (>1s) - consider optimizing agent decision logic');
    }
    
    // Agent recommendations
    if (comparison.comparisons.length > 1) {
      const best = comparison.comparisons[0];
      recommendations.push(`Consider using ${best.agentType} for production - highest efficiency`);
    }
    
    return recommendations;
  }

  private checkPerformanceAlerts(metrics: RealTimeMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    
    if (metrics.currentMemoryUsage > 500) {
      alerts.push({
        type: 'memory',
        severity: 'high',
        message: 'Memory usage exceeds 500MB',
        timestamp: new Date()
      });
    }
    
    if (metrics.avgStepTime > 2000) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: 'Average step time exceeds 2 seconds',
        timestamp: new Date()
      });
    }
    
    if (metrics.recentThroughput < 10) {
      alerts.push({
        type: 'throughput',
        severity: 'low',
        message: 'Low throughput detected (<10 steps/minute)',
        timestamp: new Date()
      });
    }
    
    return alerts;
  }

  private log(level: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      sessionId: this.sessionId,
      ...data
    };
    
    console.log(`[PerformanceMonitor] ${level.toUpperCase()}: ${message}`, data || '');
  }

  /**
   * Reset monitoring session
   */
  public reset(): void {
    this.sessionId = `session-${Date.now()}`;
    this.startTime = new Date();
    this.measurements = [];
    this.agentMetrics.clear();
    this.environmentMetrics.clear();
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  /**
   * Get monitoring statistics
   */
  public getStats(): PerformanceMonitorStats {
    return {
      sessionId: this.sessionId,
      uptime: Date.now() - this.startTime.getTime(),
      measurementCount: this.measurements.length,
      agentCount: this.agentMetrics.size,
      environmentCount: this.environmentMetrics.size,
      memoryBaseline: this.memoryBaseline,
      currentMemory: this.getCurrentMemoryUsage()
    };
  }
}

// Supporting interfaces
export interface SimulationSession {
  id: string;
  agentId: string;
  agentType: AgentType;
  environmentId: string;
  environmentType: EnvironmentType;
  startTime: Date;
  stepCount: number;
  totalReward: number;
  avgStepTime: number;
  memoryUsage: number;
}

export interface PerformanceMeasurement {
  timestamp: Date;
  sessionId: string;
  type: 'step' | 'episode' | 'simulation';
  duration: number;
  memoryUsage: number;
  metadata?: Record<string, unknown>;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentType: AgentType;
  stepCount: number;
  totalStepTime: number;
  totalReward: number;
  errorCount: number;
  lastUpdate: Date;
}

export interface EnvironmentPerformanceMetrics {
  environmentId: string;
  environmentType: EnvironmentType;
  episodeCount: number;
  totalSteps: number;
  avgEpisodeLength: number;
  lastUpdate: Date;
}

export interface SimulationSummary {
  sessionId: string;
  agentType: AgentType;
  environmentType: EnvironmentType;
  totalDuration: number;
  totalSteps: number;
  totalReward: number;
  avgReward: number;
  avgStepTime: number;
  stepsPerSecond: number;
  memoryGrowth: number;
  efficiency: number;
}

export interface AgentPerformanceComparison {
  agentId: string;
  agentType: AgentType;
  avgStepTime: number;
  avgReward: number;
  totalSteps: number;
  errorRate: number;
  efficiency: number;
}

export interface AgentComparison {
  timestamp: Date;
  agentCount: number;
  comparisons: AgentPerformanceComparison[];
  winner: AgentPerformanceComparison;
  insights: string[];
}

export interface RealTimeMetrics {
  timestamp: Date;
  sessionUptime: number;
  currentMemoryUsage: number;
  memoryGrowthRate: number;
  avgStepTime: number;
  totalMeasurements: number;
  activeAgents: number;
  recentThroughput: number;
}

export interface PerformanceAlert {
  type: 'memory' | 'performance' | 'throughput';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}

export interface PerformanceReport {
  sessionId: string;
  generatedAt: Date;
  sessionDuration: number;
  overallMetrics: RealTimeMetrics;
  agentComparison: AgentComparison;
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export interface PerformanceExport {
  sessionId: string;
  exportedAt: Date;
  measurements: PerformanceMeasurement[];
  agentMetrics: Record<string, AgentPerformanceMetrics>;
  environmentMetrics: Record<string, EnvironmentPerformanceMetrics>;
  summary: RealTimeMetrics;
}

export interface PerformanceMonitorStats {
  sessionId: string;
  uptime: number;
  measurementCount: number;
  agentCount: number;
  environmentCount: number;
  memoryBaseline: number;
  currentMemory: number;
} 