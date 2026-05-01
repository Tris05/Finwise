"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Activity } from "lucide-react"

interface SecurityMetric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  icon: React.ReactNode
}

export function SecurityMetrics() {
  const metrics: SecurityMetric[] = [
    {
      label: "Security Score",
      value: 85,
      trend: 'stable',
      status: 'good',
      icon: <Shield className="h-4 w-4" />
    },
    {
      label: "Active Sessions",
      value: 3,
      trend: 'down',
      status: 'good',
      icon: <Users className="h-4 w-4" />
    },
    {
      label: "Failed Login Attempts",
      value: 2,
      trend: 'up',
      status: 'warning',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      label: "Last Security Scan",
      value: "2 hours ago",
      trend: 'stable',
      status: 'good',
      icon: <Activity className="h-4 w-4" />
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'critical':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time security metrics and status
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
                    {metric.icon}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Authentication</span>
              <span className="text-green-600">Strong</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Device Security</span>
              <span className="text-green-600">Good</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Session Management</span>
              <span className="text-yellow-600">Fair</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monitoring</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Password changed successfully</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-green-600">
              Success
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Failed login attempt detected</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-yellow-600">
              Warning
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">New device added</p>
                <p className="text-xs text-muted-foreground">1 week ago</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-green-600">
              Success
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
