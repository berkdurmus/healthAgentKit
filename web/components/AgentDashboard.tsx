import React from 'react'
import { 
  Brain, 
  Cpu, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'

interface AgentPerformance {
  accuracy: number
  efficiency: number
  avgResponseTime: number
  patientsProcessed: number
  totalReward?: number
  decisionConfidence?: number
  learningProgress?: number
}

interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'training' | 'paused' | 'error'
  description?: string
  performance: AgentPerformance
  lastUpdate?: Date
  capabilities?: string[]
}

interface AgentDashboardProps {
  agents: Agent[]
  selectedAgent?: Agent
  onAgentSelect?: (agent: Agent) => void
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
  agents, 
  selectedAgent, 
  onAgentSelect 
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'training': return 'info'
      case 'paused': return 'warning'
      case 'error': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'training': return <Activity className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'ml_model': return <Cpu className="h-5 w-5 text-blue-500" />
      case 'llm_agent': return <Zap className="h-5 w-5 text-purple-500" />
      case 'rule_based': return <Target className="h-5 w-5 text-green-500" />
      default: return <Brain className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card 
            key={agent.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onAgentSelect?.(agent)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getAgentTypeIcon(agent.type)}
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Badge variant={getStatusVariant(agent.status)} className="flex items-center space-x-1">
                  {getStatusIcon(agent.status)}
                  <span className="ml-1 capitalize">{agent.status}</span>
                </Badge>
              </div>
              {agent.description && (
                <CardDescription className="text-sm">
                  {agent.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">{agent.performance.accuracy}%</span>
                  </div>
                  <Progress value={agent.performance.accuracy} className="h-1" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Efficiency</span>
                    <span className="font-medium">{agent.performance.efficiency}%</span>
                  </div>
                  <Progress value={agent.performance.efficiency} className="h-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Response</span>
                  <span className="font-medium">{agent.performance.avgResponseTime}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Processed</span>
                  <span className="font-medium">{agent.performance.patientsProcessed}</span>
                </div>
              </div>

              {/* Capabilities */}
              {agent.capabilities && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Capabilities</span>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Agent View */}
      {selectedAgent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getAgentTypeIcon(selectedAgent.type)}
                <div>
                  <CardTitle className="text-xl">{selectedAgent.name}</CardTitle>
                  <CardDescription>
                    Detailed performance metrics and configuration
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getStatusVariant(selectedAgent.status)} className="flex items-center space-x-1">
                {getStatusIcon(selectedAgent.status)}
                <span className="ml-1 capitalize">{selectedAgent.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Performance</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Accuracy</span>
                      <span className="font-medium">{selectedAgent.performance.accuracy}%</span>
                    </div>
                    <Progress value={selectedAgent.performance.accuracy} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Efficiency</span>
                      <span className="font-medium">{selectedAgent.performance.efficiency}%</span>
                    </div>
                    <Progress value={selectedAgent.performance.efficiency} />
                  </div>
                  {selectedAgent.performance.decisionConfidence && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Confidence</span>
                        <span className="font-medium">{selectedAgent.performance.decisionConfidence}%</span>
                      </div>
                      <Progress value={selectedAgent.performance.decisionConfidence} />
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Operations</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Avg Response Time</span>
                    </div>
                    <span className="font-medium">{selectedAgent.performance.avgResponseTime}s</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Patients Processed</span>
                    </div>
                    <span className="font-medium">{selectedAgent.performance.patientsProcessed}</span>
                  </div>
                  {selectedAgent.performance.totalReward && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Reward</span>
                      </div>
                      <span className="font-medium">{selectedAgent.performance.totalReward.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Progress (for ML agents) */}
              {selectedAgent.type === 'ml_model' && selectedAgent.performance.learningProgress && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Learning</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Training Progress</span>
                        <span className="font-medium">{selectedAgent.performance.learningProgress}%</span>
                      </div>
                      <Progress value={selectedAgent.performance.learningProgress} />
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">Active Learning</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Continuously improving from patient interactions
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* All Capabilities */}
            {selectedAgent.capabilities && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AgentDashboard 