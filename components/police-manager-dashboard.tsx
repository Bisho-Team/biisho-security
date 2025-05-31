"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, AlertTriangle, CheckCircle, Clock, Users, FileText, Plus, Eye, MessageSquare } from "lucide-react"

const mockAlarmReports = [
  {
    id: "1",
    type: "Motion Detection",
    location: "Main Entrance - Downtown Office",
    status: "pending",
    time: "5 minutes ago",
    severity: "high",
    dispatchedBy: "Downtown Office Manager",
    description: "Unauthorized motion detected at main entrance after hours",
  },
  {
    id: "2",
    type: "Door Breach",
    location: "Server Room - North Branch",
    status: "acknowledged",
    time: "20 minutes ago",
    severity: "critical",
    dispatchedBy: "North Branch Manager",
    description: "Server room door opened without authorization",
  },
  {
    id: "3",
    type: "Window Sensor",
    location: "Office 201 - Downtown Office",
    status: "resolved",
    time: "2 hours ago",
    severity: "medium",
    dispatchedBy: "Downtown Office Manager",
    description: "Window sensor triggered - false alarm due to maintenance",
  },
]

const mockPoliceOperators = [
  { id: "1", name: "Officer Johnson", badge: "P001", status: "on-duty", shift: "Day", assignedReports: 3 },
  { id: "2", name: "Officer Smith", badge: "P002", status: "on-duty", shift: "Night", assignedReports: 1 },
  { id: "3", name: "Officer Davis", badge: "P003", status: "off-duty", shift: "Day", assignedReports: 0 },
]

export default function PoliceManagerDashboard() {
  const [reports, setReports] = useState(mockAlarmReports)
  const [operators, setOperators] = useState(mockPoliceOperators)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  const acknowledgeReport = (reportId: string) => {
    setReports(reports.map((report) => (report.id === reportId ? { ...report, status: "acknowledged" } : report)))
  }

  const resolveReport = (reportId: string) => {
    setReports(reports.map((report) => (report.id === reportId ? { ...report, status: "resolved" } : report)))
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
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "acknowledged":
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reports.filter((r) => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter((r) => r.status === "acknowledged").length}
            </div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Officers On Duty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operators.filter((o) => o.status === "on-duty").length}</div>
            <p className="text-xs text-muted-foreground">Available for dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter((r) => r.status === "resolved").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Alarm Reports</TabsTrigger>
          <TabsTrigger value="officers">Officer Management</TabsTrigger>
          <TabsTrigger value="analytics">Response Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Alarm Reports</h3>
            <div className="flex space-x-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id} className={selectedReport === report.id ? "ring-2 ring-blue-500" : ""}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(report.status)}
                        <div>
                          <h4 className="font-medium">{report.type}</h4>
                          <p className="text-sm text-gray-500">{report.location}</p>
                          <p className="text-xs text-gray-400">
                            Dispatched by: {report.dispatchedBy} • {report.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                        <Badge variant="outline">{report.status}</Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm">{report.description}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {report.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => acknowledgeReport(report.id)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {report.status === "acknowledged" && (
                        <Button
                          size="sm"
                          onClick={() => resolveReport(report.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="officers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Officer Management</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Officer
            </Button>
          </div>

          <div className="grid gap-4">
            {operators.map((officer) => (
              <Card key={officer.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{officer.name}</h4>
                        <p className="text-sm text-gray-500">Badge: {officer.badge}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{officer.shift} Shift</Badge>
                          <Badge variant={officer.status === "on-duty" ? "default" : "secondary"}>
                            {officer.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{officer.assignedReports}</p>
                        <p className="text-xs text-gray-500">Assigned Reports</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Assign Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Analytics</CardTitle>
                <CardDescription>Average response times by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Alarms</span>
                    <span className="font-medium">2.3 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Priority</span>
                    <span className="font-medium">5.7 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium Priority</span>
                    <span className="font-medium">12.1 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Statistics</CardTitle>
                <CardDescription>This month's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Reports</span>
                    <span className="font-medium">47</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resolved</span>
                    <span className="font-medium text-green-600">42 (89%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">False Alarms</span>
                    <span className="font-medium text-yellow-600">8 (17%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
