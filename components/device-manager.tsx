"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Smartphone, Laptop, Monitor, Tablet, X, Check, AlertTriangle } from "lucide-react"

interface Device {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
  location: string
  lastActive: string
  isCurrent: boolean
  isTrusted: boolean
}

export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Chrome on Windows',
      type: 'desktop',
      browser: 'Chrome',
      os: 'Windows 11',
      location: 'Mumbai, India',
      lastActive: '2024-01-15T10:30:00Z',
      isCurrent: true,
      isTrusted: true
    },
    {
      id: '2',
      name: 'Safari on iPhone',
      type: 'mobile',
      browser: 'Safari',
      os: 'iOS 17',
      location: 'Mumbai, India',
      lastActive: '2024-01-14T18:45:00Z',
      isCurrent: false,
      isTrusted: true
    },
    {
      id: '3',
      name: 'Chrome on MacBook',
      type: 'desktop',
      browser: 'Chrome',
      os: 'macOS Sonoma',
      location: 'Delhi, India',
      lastActive: '2024-01-13T14:20:00Z',
      isCurrent: false,
      isTrusted: false
    }
  ])

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Active now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  const handleRemoveDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId))
  }

  const handleToggleTrust = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, isTrusted: !device.isTrusted } : device
    ))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage devices that have access to your account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{device.name}</p>
                    {device.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {device.isTrusted && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Trusted
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {device.location} • {formatLastActive(device.lastActive)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleTrust(device.id)}
                  className="text-xs"
                >
                  {device.isTrusted ? 'Remove Trust' : 'Add Trust'}
                </Button>
                {!device.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveDevice(device.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800">Security Tip</h3>
              <p className="text-sm text-orange-600 mt-1">
                Only trust devices you regularly use. Remove unfamiliar devices to keep your account secure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
