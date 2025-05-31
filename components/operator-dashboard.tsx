"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, Shield, Building, Eye, MessageSquare, MapPin } from "lucide-react"

interface User {
  role: string
  name: string
  id: string
  managedBy?: string
  type?: string
}

interface OperatorDashboardProps {
  user: User
}

const mockOfficeAlarms = [
  {
    id: "1",
    type: "Motion Detection",
    location: "Main Entrance",
    status: "active",
    time: "3 minutes ago",
    severity: "high",
  },
  {
    id: "2",
    type: "Door Sensor",
    location: "Storage Room",
    status: "acknowledged",
    time: "10 minutes ago",
    severity: "medium",
  },
]

const mockPoliceReports = [
  {
    id: "1",
    type: "Burglary Report",
    location: "Downtown Office",
    status: "assigned",
    time: "15 minutes ago",
    severity: "high",
  },
  {
    id: "2",
    type: "Vandalism",
    location: "North Branch",
    status: "investigating",
    time: "45 minutes ago",
    severity: "medium",
  },
]

export default function OperatorDashboard({ user }: OperatorDashboardProps) {
  const [alarms, setAlarms] = useState(user.type === "office" ? mockOfficeAlarms : mockPoliceReports)

  const isOfficeOperator = user.type === "office"
  const isPoliceOperator = user.type === "police"

  const acknowledgeItem = (itemId: string) => {
    setAlarms(
      alarms.map((alarm) =>
        alarm.id === itemId ? { ...alarm, status: isOfficeOperator ? "acknowledged" : "investigating" } : alarm,
      ),
    )
  }

  const resolveItem = (itemId: string) => {
    setAlarms(alarms.map((alarm) => (alarm.id === itemId ? { ...alarm, status: "resolved" } : alarm)))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "assigned":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "acknowledged":
      case "investigating":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isOfficeOperator ? "Active Alarms" : "Assigned Reports"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alarms.filter((a) => a.status === "active" || a.status === "assigned").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alarms.filter((a) => a.status === "acknowledged" || a.status === "investigating").length}
            </div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {alarms.filter((a) => a.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isOfficeOperator ? <Building className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            <span>{isOfficeOperator ? "Alarm Management" : "Report Management"}</span>
          </CardTitle>
          <CardDescription>
            {isOfficeOperator
              ? "Monitor and manage security alarms for your assigned locations"
              : "Handle assigned police reports and investigations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alarms.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.type}</h4>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location} • {item.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(item.severity)}>{item.severity}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                      <div className="flex space-x-1">
                        {(item.status === "active" || item.status === "assigned") && (
                          <Button
                            size="sm"
                            onClick={() => acknowledgeItem(item.id)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            {isOfficeOperator ? "Acknowledge" : "Start Investigation"}
                          </Button>
                        )}
                        {(item.status === "acknowledged" || item.status === "investigating") && (
                          <Button
                            size="sm"
                            onClick={() => resolveItem(item.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Resolve
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional operator-specific features */}
      {isOfficeOperator && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common security management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span className="text-xs">Manual Alarm</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Building className="h-6 w-6 mb-2" />
                <span className="text-xs">System Check</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Shield className="h-6 w-6 mb-2" />
                <span className="text-xs">Emergency Protocol</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Contact Manager</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isPoliceOperator && (
        <Card>
          <CardHeader>
            <CardTitle>Investigation Tools</CardTitle>
            <CardDescription>Resources for handling reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Shield className="h-6 w-6 mb-2" />
                <span className="text-xs">Evidence Log</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                <span className="text-xs">Witness Statement</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                <span className="text-xs">Location Details</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <CheckCircle className="h-6 w-6 mb-2" />
                <span className="text-xs">Case Closure</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
