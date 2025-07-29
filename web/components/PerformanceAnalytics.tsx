import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Clock, 
  Target,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  Heart,
  DollarSign
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Select, SelectOption } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

// Simple chart components (in a real app, you'd use recharts or similar)
const SimpleLineChart: React.FC<{ data: Array<{time: string, value: number}>, color?: string }> = ({ data, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  return (
    <div className="h-32 w-full relative">
      <svg className="w-full h-full" viewBox="0 0 400 100">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400
            const y = 100 - ((point.value - minValue) / range) * 80 - 10
            return `${x},${y}`
          }).join(' ')}
        />
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 400
          const y = 100 - ((point.value - minValue) / range) * 80 - 10
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-4 transition-all"
            />
          )
        })}
      </svg>
    </div>
  )
}

const SimpleBarChart: React.FC<{ data: Array<{label: string, value: number}>, color?: string }> = ({ data, color = '#10b981' }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="h-32 flex items-end justify-between space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-current rounded-t transition-all duration-300"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              color: color,
              minHeight: '4px'
            }}
          />
          <span className="text-xs text-muted-foreground mt-1 truncate">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

interface PerformanceMetrics {
  realTimeMetrics: {
    activeAgents: number
    totalThroughput: number
    avgResponseTime: number
    successRate: number
    currentEpisode: number
    queueLength: number
  }
  historicalData: {
    throughput: Array<{time: string, value: number}>
    responseTime: Array<{time: string, value: number}>
    successRate: Array<{time: string, value: number}>
    patientSatisfaction: Array<{time: string, value: number}>
  }
  agentComparison: Array<{
    agentName: string
    accuracy: number
    efficiency: number
    throughput: number
    totalReward: number
  }>
  systemHealth: {
    cpuUsage: number
    memoryUsage: number
    networkLatency: number
    errorRate: number
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: Date
  }>
}

const generateMockMetrics = (): PerformanceMetrics => {
  const now = new Date()
  const timePoints = Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })

  return {
    realTimeMetrics: {
      activeAgents: 4,
      totalThroughput: 24.7,
      avgResponseTime: 2.8,
      successRate: 94.2,
      currentEpisode: 247,
      queueLength: 12
    },
    historicalData: {
      throughput: timePoints.map(time => ({
        time,
        value: 20 + Math.random() * 15
      })),
      responseTime: timePoints.map(time => ({
        time,
        value: 2 + Math.random() * 3
      })),
      successRate: timePoints.map(time => ({
        time,
        value: 88 + Math.random() * 10
      })),
      patientSatisfaction: timePoints.map(time => ({
        time,
        value: 3.8 + Math.random() * 1.4
      }))
    },
    agentComparison: [
      { agentName: 'LLM Clinical', accuracy: 96.7, efficiency: 83.2, throughput: 18.4, totalReward: 2891.4 },
      { agentName: 'ML Neural Net', accuracy: 94.1, efficiency: 91.8, throughput: 22.1, totalReward: 2234.7 },
      { agentName: 'Rule-Based', accuracy: 92.5, efficiency: 87.3, throughput: 28.9, totalReward: 1847.3 },
      { agentName: 'Random Baseline', accuracy: 54.3, efficiency: 45.1, throughput: 31.2, totalReward: 234.8 }
    ],
    systemHealth: {
      cpuUsage: 45.2,
      memoryUsage: 67.8,
      networkLatency: 23.4,
      errorRate: 0.2
    },
    alerts: [
      {
        id: '1',
        type: 'warning',
        message: 'High memory usage detected in ML Neural Network agent',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: '2',
        type: 'info',
        message: 'Performance optimization completed for Rule-Based agent',
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      }
    ]
  }
}

const PerformanceAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(generateMockMetrics())
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedMetric, setSelectedMetric] = useState('throughput')
  const [isRealTime, setIsRealTime] = useState(true)

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTime) return
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        realTimeMetrics: {
          ...prev.realTimeMetrics,
          totalThroughput: 20 + Math.random() * 15,
          avgResponseTime: 2 + Math.random() * 3,
          successRate: 88 + Math.random() * 10,
          queueLength: Math.floor(Math.random() * 20)
        }
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [isRealTime])

  const refreshData = () => {
    setMetrics(generateMockMetrics())
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and comparative analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRealTime ? 'success' : 'secondary'} className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>{isRealTime ? 'Real-time' : 'Paused'}</span>
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              all systems operational
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.totalThroughput.toFixed(1)}/h</div>
            <p className="text-xs text-muted-foreground">
              patients per hour
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.avgResponseTime.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              average response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              successful decisions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Episode</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.currentEpisode}</div>
            <p className="text-xs text-muted-foreground">
              current simulation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.realTimeMetrics.queueLength}</div>
            <p className="text-xs text-muted-foreground">
              patients waiting
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="comparison">Agent Comparison</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Throughput Over Time
                  </CardTitle>
                  <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <SelectOption value="1h">Last Hour</SelectOption>
                    <SelectOption value="24h">Last 24 Hours</SelectOption>
                    <SelectOption value="7d">Last 7 Days</SelectOption>
                    <SelectOption value="30d">Last 30 Days</SelectOption>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={metrics.historicalData.throughput} 
                  color="#3b82f6"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Response Time Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={metrics.historicalData.responseTime} 
                  color="#f59e0b"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={metrics.historicalData.successRate} 
                  color="#10b981"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Patient Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={metrics.historicalData.patientSatisfaction} 
                  color="#ec4899"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Comparison</CardTitle>
              <CardDescription>
                Comparative analysis of all active agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {metrics.agentComparison.map((agent, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{agent.agentName}</h4>
                      <Badge variant="outline">
                        Total Reward: {agent.totalReward.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Accuracy</span>
                          <span className="font-medium">{agent.accuracy}%</span>
                        </div>
                        <Progress value={agent.accuracy} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Efficiency</span>
                          <span className="font-medium">{agent.efficiency}%</span>
                        </div>
                        <Progress value={agent.efficiency} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Throughput</span>
                          <span className="font-medium">{agent.throughput}/h</span>
                        </div>
                        <Progress value={(agent.throughput / 35) * 100} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span className="font-medium">{metrics.systemHealth.cpuUsage}%</span>
                  </div>
                  <Progress value={metrics.systemHealth.cpuUsage} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span className="font-medium">{metrics.systemHealth.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.systemHealth.memoryUsage} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network Latency</span>
                    <span className="font-medium">{metrics.systemHealth.networkLatency}ms</span>
                  </div>
                  <Progress value={(metrics.systemHealth.networkLatency / 100) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant={metrics.systemHealth.errorRate < 1 ? 'success' : 'destructive'}>
                      {metrics.systemHealth.errorRate}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Uptime</span>
                    <Badge variant="success">99.97%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Last Incident</span>
                    <span className="text-sm text-muted-foreground">2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                System notifications and performance alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={getAlertVariant(alert.type) as any}>
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceAnalytics 