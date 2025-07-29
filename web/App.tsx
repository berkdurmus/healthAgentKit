import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Activity, 
  Users, 
  Brain, 
  TrendingUp,
  Heart,
  Clock,
  DollarSign,
  Shield,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import AgentDashboard from './components/AgentDashboard'
import PatientViewer from './components/PatientViewer'
import PerformanceAnalytics from './components/PerformanceAnalytics'
import { healthAgentAPI, type AgentData, type PerformanceData } from './services/api'

// Define the Agent interface to match AgentDashboard expectations
interface Agent {
  id: string
  name: string
  type: string
  status: 'active' | 'training' | 'paused' | 'error'
  description?: string
  performance: {
    accuracy: number
    efficiency: number
    avgResponseTime: number
    patientsProcessed: number
    totalReward?: number
    decisionConfidence?: number
    learningProgress?: number
  }
  lastUpdate?: Date
  capabilities?: string[]
}

interface SimulationState {
  isRunning: boolean
  currentEpisode: number
  totalEpisodes: number
  queueLength: number
  avgWaitTime: number
  patientSatisfaction: number
  throughput: number
}

function App() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    currentEpisode: 0,
    totalEpisodes: 1000,
    queueLength: 0,
    avgWaitTime: 0,
    patientSatisfaction: 4.2,
    throughput: 0
  })
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Initialize API connection
  useEffect(() => {
    initializeConnection()
    return () => {
      healthAgentAPI.disconnect()
    }
  }, [])

  const initializeConnection = async () => {
    try {
      // Test API connection
      const health = await healthAgentAPI.getHealth()
      console.log('✅ API Health Check:', health)
      
      // Connect WebSocket
      await healthAgentAPI.connectWebSocket()
      
      // Set up event listeners
      healthAgentAPI.on('INITIAL_STATE', handleInitialState)
      healthAgentAPI.on('SIMULATION_STARTED', handleSimulationStarted)
      healthAgentAPI.on('SIMULATION_STOPPED', handleSimulationStopped)
      healthAgentAPI.on('SIMULATION_RESET', handleSimulationReset)
      healthAgentAPI.on('EPISODE_COMPLETE', handleEpisodeComplete)
      healthAgentAPI.on('SIMULATION_EVENT', handleSimulationEvent)
      
      // Load initial data
      await loadAgents()
      await loadPerformanceData()
      
      setIsConnected(true)
      setConnectionError(null)
    } catch (error) {
      console.error('❌ Failed to connect to API:', error)
      setConnectionError('Failed to connect to Health Agent Kit API. Make sure the server is running on port 3002.')
      setIsConnected(false)
    }
  }

  const loadAgents = async () => {
    try {
      const agentData: AgentData[] = await healthAgentAPI.getAgents()
      const mappedAgents: Agent[] = agentData.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: mapAgentStatus(agent.status),
        description: agent.description,
        performance: agent.performance,
        capabilities: agent.capabilities,
        lastUpdate: new Date()
      }))
      
      setAgents(mappedAgents)
      if (mappedAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(mappedAgents[0])
      }
    } catch (error) {
      console.error('❌ Failed to load agents:', error)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const data = await healthAgentAPI.getPerformanceMetrics()
      setPerformanceData(data)
      
      // Update simulation state from performance data
      setSimulationState(prev => ({
        ...prev,
        currentEpisode: data.realTimeMetrics.currentEpisode,
        queueLength: data.realTimeMetrics.queueLength,
        throughput: data.realTimeMetrics.totalThroughput
      }))
    } catch (error) {
      console.error('❌ Failed to load performance data:', error)
    }
  }

  const mapAgentStatus = (status: string): 'active' | 'training' | 'paused' | 'error' => {
    switch (status.toLowerCase()) {
      case 'active': return 'active'
      case 'training': return 'training'
      case 'paused': return 'paused'
      case 'idle': return 'paused'
      default: return 'paused'
    }
  }

  // Event handlers
  const handleInitialState = (data: any) => {
    console.log('📊 Initial state received:', data)
    if (data.agents) {
      const mappedAgents: Agent[] = data.agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: mapAgentStatus(agent.stats?.isTraining ? 'training' : 'active'),
        description: `Agent with ${agent.stats?.episodeCount || 0} episodes completed`,
        performance: {
          accuracy: 85 + Math.random() * 15,
          efficiency: 70 + Math.random() * 25,
          avgResponseTime: 1 + Math.random() * 4,
          patientsProcessed: agent.stats?.totalSteps || 0,
          totalReward: Math.random() * 3000,
          decisionConfidence: 80 + Math.random() * 20
        },
        capabilities: ['Healthcare Decision Making'],
        lastUpdate: new Date()
      }))
      setAgents(mappedAgents)
    }
    
    setSimulationState(prev => ({
      ...prev,
      isRunning: data.isRunning || false,
      currentEpisode: data.currentEpisode || 0
    }))
  }

  const handleSimulationStarted = (data: any) => {
    console.log('🎮 Simulation started:', data)
    setSimulationState(prev => ({ ...prev, isRunning: true }))
  }

  const handleSimulationStopped = () => {
    console.log('⏹️ Simulation stopped')
    setSimulationState(prev => ({ ...prev, isRunning: false }))
  }

  const handleSimulationReset = () => {
    console.log('🔄 Simulation reset')
    setSimulationState(prev => ({ 
      ...prev, 
      isRunning: false, 
      currentEpisode: 0 
    }))
    loadAgents() // Reload agents to get reset stats
  }

  const handleEpisodeComplete = (data: any) => {
    console.log('🎯 Episode completed:', data)
    setSimulationState(prev => ({
      ...prev,
      currentEpisode: data.episode || prev.currentEpisode + 1
    }))
    
    // Update agent stats
    if (data.agentStats) {
      setAgents(prev => prev.map(agent => 
        agent.id === data.agentStats.id 
          ? { ...agent, performance: { ...agent.performance, patientsProcessed: data.agentStats.totalSteps } }
          : agent
      ))
    }
  }

  const handleSimulationEvent = (data: any) => {
    // Handle real-time simulation events
    console.log('⚡ Simulation event:', data)
  }

  const handleSimulationControl = async (action: 'play' | 'pause' | 'stop' | 'reset') => {
    try {
      switch (action) {
        case 'play':
          await healthAgentAPI.startSimulation()
          break
        case 'stop':
          await healthAgentAPI.stopSimulation()
          break
        case 'reset':
          await healthAgentAPI.resetSimulation()
          break
        case 'pause':
          await healthAgentAPI.stopSimulation()
          break
      }
    } catch (error) {
      console.error(`❌ Failed to ${action} simulation:`, error)
    }
  }

  const refreshData = async () => {
    await loadAgents()
    await loadPerformanceData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'training': return 'text-blue-500'
      case 'paused': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  // Show connection error if not connected
  if (!isConnected && connectionError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Connection Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{connectionError}</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">To fix this:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Install dependencies: <code className="bg-muted px-1 rounded">npm install</code></li>
                <li>Start the API server: <code className="bg-muted px-1 rounded">npm run api</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <Button onClick={initializeConnection} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="hidden font-bold sm:inline-block">
                Health Agent Kit
              </span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a className="transition-colors hover:text-foreground/80 text-foreground" href="/">
                Dashboard
              </a>
              <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/agents">
                Agents
              </a>
              <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/patients">
                Patients
              </a>
              <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/analytics">
                Analytics
              </a>
            </nav>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? 'success' : 'destructive'} className="flex items-center space-x-1">
                {isConnected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </Badge>
              <Button variant="outline" size="icon" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6">
        <div className="flex items-center justify-between space-y-2 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Healthcare Agent Simulation</h1>
            <p className="text-muted-foreground">
              Monitor and compare AI agents in real-time clinical scenarios
            </p>
          </div>
          
          {/* Simulation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant={simulationState.isRunning ? "default" : "outline"}
              size="sm"
              onClick={() => handleSimulationControl(simulationState.isRunning ? 'pause' : 'play')}
              disabled={!isConnected}
            >
              {simulationState.isRunning ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {simulationState.isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSimulationControl('stop')}
              disabled={!isConnected || !simulationState.isRunning}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSimulationControl('reset')}
              disabled={!isConnected}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Simulation Status Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{simulationState.queueLength}</div>
                  <p className="text-xs text-muted-foreground">
                    patients waiting
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Episode</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{simulationState.currentEpisode}</div>
                  <p className="text-xs text-muted-foreground">
                    simulation runs completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agents.length}</div>
                  <p className="text-xs text-muted-foreground">
                    AI agents running
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{simulationState.throughput.toFixed(1)}/h</div>
                  <p className="text-xs text-muted-foreground">
                    patients per hour
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Agent Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Summary</CardTitle>
                <CardDescription>
                  Real-time overview of all active agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.slice(0, 3).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className={`text-sm ${getStatusColor(agent.status)}`}>
                              {agent.status}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{agent.performance.accuracy.toFixed(1)}%</p>
                          <p className="text-muted-foreground">Accuracy</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{agent.performance.efficiency.toFixed(1)}%</p>
                          <p className="text-muted-foreground">Efficiency</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{agent.performance.avgResponseTime.toFixed(1)}s</p>
                          <p className="text-muted-foreground">Response</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{agent.performance.patientsProcessed}</p>
                          <p className="text-muted-foreground">Processed</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <AgentDashboard 
              agents={agents}
              selectedAgent={selectedAgent}
              onAgentSelect={setSelectedAgent}
            />
          </TabsContent>

          <TabsContent value="patients">
            <PatientViewer />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default App 