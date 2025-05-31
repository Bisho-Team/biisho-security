"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Building, Users, Plus, Send, Settings, MapPin, Clock, CheckCircle, XCircle } from "lucide-react"

const mockAlarms = [
  {
    id: "1",
    type: "Motion Detection",
    location: "Main Entrance",
    status: "active",
    time: "2 minutes ago",
    severity: "high",
  },
  {
    id: "2",
    type: "Door Breach",
    location: "Server Room",
    status: "acknowledged",
    time: "15 minutes ago",
    severity: "critical",
  },
  {
    id: "3",
    type: "Window Sensor",
    location: "Office 201",
    status: "resolved",
    time: "1 hour ago",
    severity: "medium",
  },
]

const mockBranches = [
  { id: "1", name: "Main Office", address: "123 Business St", operators: 3, alarms: 5, status: "active" },
  { id: "2", name: "North Branch", address: "456 North Ave", operators: 2, alarms: 2, status: "active" },
  { id: "3", name: "South Branch", address: "789 South Rd", operators: 1, alarms: 0, status: "maintenance" },
]

const mockOperators = [
  { id: "1", name: "Alice Cooper", email: "alice@koppa.com", branch: "Main Office", status: "active", shift: "Day" },
  { id: "2", name: "Bob Wilson", email: "bob@koppa.com", branch: "North Branch", status: "active", shift: "Night" },
  { id: "3", name: "Carol Davis", email: "carol@koppa.com", branch: "Main Office", status: "off-duty", shift: "Day" },
]

export default function OfficeManagerDashboard() {
  const [alarms, setAlarms] = useState(mockAlarms)
  const [branches, setBranches] = useState(mockBranches)
  const [operators, setOperators] = useState(mockOperators)
  const [dispatchMessage, setDispatchMessage] = useState("")

  const dispatchToPolice = (alarmId: string) => {
    setAlarms(alarms.map((alarm) => (alarm.id === alarmId ? { ...alarm, status: "dispatched" } : alarm)))
    alert("Alarm dispatched to Police Manager successfully!")
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
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "acknowledged":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "dispatched":
        return <Send className="h-4 w-4 text-blue-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alarms</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alarms.filter((a) => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              {branches.filter((b) => b.status === "active").length} operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Operators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operators.length}</div>
            <p className="text-xs text-muted-foreground">
              {operators.filter((o) => o.status === "active").length} on duty
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="alarms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alarms">Alarm Management</TabsTrigger>
          <TabsTrigger value="branches">Branch Management</TabsTrigger>
          <TabsTrigger value="operators">Operator Management</TabsTrigger>
          <TabsTrigger value="settings">System Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="alarms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Alarm System</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Configure New Alarm
            </Button>
          </div>

          <div className="grid gap-4">
            {alarms.map((alarm) => (
              <Card key={alarm.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(alarm.status)}
                      <div>
                        <h4 className="font-medium">{alarm.type}</h4>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {alarm.location} • {alarm.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(alarm.severity)}>{alarm.severity}</Badge>
                      <Badge variant="outline">{alarm.status}</Badge>
                      {alarm.status === "active" && (
                        <Button
                          size="sm"
                          onClick={() => dispatchToPolice(alarm.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Dispatch to Police
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Branch Management</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </div>

          <div className="grid gap-4">
            {branches.map((branch) => (
              <Card key={branch.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{branch.name}</h4>
                        <p className="text-sm text-gray-500">{branch.address}</p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{branch.operators} operators</span>
                          <span>{branch.alarms} active alarms</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={branch.status === "active" ? "default" : "secondary"}>{branch.status}</Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Operator Management</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Operator
            </Button>
          </div>

          <div className="grid gap-4">
            {operators.map((operator) => (
              <Card key={operator.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{operator.name}</h4>
                        <p className="text-sm text-gray-500">{operator.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{operator.branch}</Badge>
                          <Badge variant="outline">{operator.shift} Shift</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={operator.status === "active" ? "default" : "secondary"}>{operator.status}</Badge>
                      <Select defaultValue={operator.branch}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.name}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Alarm System Configuration</span>
              </CardTitle>
              <CardDescription>Configure alarm types, sensitivity, and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Motion Sensor Sensitivity</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Auto-Dispatch Threshold</Label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="critical">Critical Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notification Message Template</Label>
                <Textarea
                  placeholder="Enter default dispatch message template..."
                  value={dispatchMessage}
                  onChange={(e) => setDispatchMessage(e.target.value)}
                />
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
