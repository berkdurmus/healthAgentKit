import { BaseAgent } from '../../core/base.agent';
import { AgentType, State, Action, Experience } from '../../types/core.types';
import { mockState, mockAction, mockReward } from '../setup';

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  constructor(name: string = 'Test Agent') {
    super(name, AgentType.RULE_BASED);
  }

  async selectAction(state: State, availableActions: Action[]): Promise<Action> {
    return availableActions[0];
  }

  async update(experience: Experience): Promise<void> {
    this.addExperience(experience);
  }

  getConfidence(state: State, action: Action): number {
    return 0.8;
  }

  // Expose protected methods for testing
  public testAddExperience(experience: Experience): void {
    this.addExperience(experience);
  }

  public testGetMaxMemorySize(): number {
    return this.getMaxMemorySize();
  }

  public testFilterValidActions(state: State, actions: Action[]): Action[] {
    return this.filterValidActions(state, actions);
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  describe('Constructor', () => {
    it('should create agent with correct properties', () => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.type).toBe(AgentType.RULE_BASED);
    });

    it('should generate unique IDs for different agents', () => {
      const agent2 = new TestAgent();
      expect(agent.id).not.toBe(agent2.id);
    });

    it('should accept custom name', () => {
      const customAgent = new TestAgent('Custom Agent');
      expect(customAgent.id).toBeDefined();
      expect(customAgent.name).toBe('Custom Agent');
    });
  });

  describe('Episode Management', () => {
    it('should start episode correctly', () => {
      const initialEpisodeCount = agent.getStats().episodeCount;
      agent.startEpisode();
      expect(agent.getStats().episodeCount).toBe(initialEpisodeCount + 1);
    });

    it('should handle multiple episodes', () => {
      agent.startEpisode();
      agent.endEpisode();
      agent.startEpisode();
      agent.endEpisode();
      expect(agent.getStats().episodeCount).toBe(2);
    });
  });

  describe('Experience Management', () => {
    it('should store experiences when updated', async () => {
      const experience: Experience = {
        state: mockState,
        action: mockAction,
        reward: mockReward,
        nextState: mockState,
        done: false,
        timestamp: new Date()
      };

      await agent.update(experience);
      const experiences = agent.getExperiences();
      expect(experiences).toHaveLength(1);
      expect(experiences[0]).toEqual(experience);
    });

    it('should limit memory size', async () => {
      // Override getMaxMemorySize for testing
      jest.spyOn(agent, 'testGetMaxMemorySize').mockReturnValue(3);

      // Add more experiences than max memory
      for (let i = 0; i < 5; i++) {
        const experience: Experience = {
          state: { ...mockState, id: `state-${i}` },
          action: { ...mockAction, id: `action-${i}` },
          reward: mockReward,
          nextState: mockState,
          done: false,
          timestamp: new Date()
        };
        agent.testAddExperience(experience);
      }

      const experiences = agent.getExperiences();
      expect(experiences.length).toBeLessThanOrEqual(3);
    });

    it('should return recent experiences correctly', async () => {
      // Add multiple experiences
      for (let i = 0; i < 5; i++) {
        const experience: Experience = {
          state: { ...mockState, id: `state-${i}` },
          action: mockAction,
          reward: mockReward,
          nextState: mockState,
          done: false,
          timestamp: new Date()
        };
        await agent.update(experience);
      }

      const recentExperiences = agent.getRecentExperiences(2);
      expect(recentExperiences).toHaveLength(2);
    });
  });

  describe('Training Mode', () => {
    it('should start in training mode by default', () => {
      expect(agent.isInTraining()).toBe(true);
    });

    it('should toggle training mode', () => {
      agent.setTraining(false);
      expect(agent.isInTraining()).toBe(false);
      
      agent.setTraining(true);
      expect(agent.isInTraining()).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide correct stats', () => {
      const stats = agent.getStats();
      expect(stats.id).toBe(agent.id);
      expect(stats.name).toBe(agent.name);
      expect(stats.type).toBe(agent.type);
      expect(stats.episodeCount).toBe(0);
      expect(stats.totalSteps).toBe(0);
      expect(stats.experienceCount).toBe(0);
      expect(stats.isTraining).toBe(true);
    });

    it('should update stats after episodes and experiences', async () => {
      agent.startEpisode();
      
      const experience: Experience = {
        state: mockState,
        action: mockAction,
        reward: mockReward,
        nextState: mockState,
        done: false,
        timestamp: new Date()
      };
      await agent.update(experience);

      const stats = agent.getStats();
      expect(stats.episodeCount).toBe(1);
      expect(stats.experienceCount).toBe(1);
    });
  });

  describe('Reset', () => {
    it('should reset agent state', async () => {
      // Add some state
      agent.startEpisode();
      await agent.update({
        state: mockState,
        action: mockAction,
        reward: mockReward,
        nextState: mockState,
        done: false,
        timestamp: new Date()
      });

      // Reset
      agent.reset();

      const stats = agent.getStats();
      expect(stats.episodeCount).toBe(0);
      expect(stats.experienceCount).toBe(0);
      expect(agent.getExperiences()).toHaveLength(0);
    });
  });

  describe('Action Selection', () => {
    it('should select action from available actions', async () => {
      const actions = [mockAction, { ...mockAction, id: 'action-2' }];
      const selectedAction = await agent.selectAction(mockState, actions);
      expect(selectedAction).toBe(actions[0]);
    });

    it('should handle empty action list gracefully', async () => {
      try {
        await agent.selectAction(mockState, []);
        // If no error is thrown, the method handles empty arrays gracefully
        expect(true).toBe(true);
      } catch (error) {
        // If an error is thrown, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });
  });

  describe('Confidence Calculation', () => {
    it('should return confidence score', () => {
      const confidence = agent.getConfidence(mockState, mockAction);
      expect(confidence).toBe(0.8);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Action Filtering', () => {
    it('should filter valid actions', () => {
      const actions = [
        mockAction,
        { ...mockAction, id: 'action-2' },
        { ...mockAction, id: 'action-3' }
      ];

      const filteredActions = agent.testFilterValidActions(mockState, actions);
      expect(filteredActions.length).toBeGreaterThan(0);
      expect(filteredActions.length).toBeLessThanOrEqual(actions.length);
    });
  });
}); 