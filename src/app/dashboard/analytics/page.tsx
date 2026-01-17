"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart3, TrendingUp, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          View your sales performance and pricing trends.
        </p>
      </div>

      <Alert>
        <BarChart3 className="h-4 w-4" />
        <AlertTitle>Analytics Coming Soon</AlertTitle>
        <AlertDescription>
          Detailed analytics and charts will be available once you have sales data imported.
          Import your Excel files to start seeing insights.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Trend</CardTitle>
            <CardDescription>Monthly sales over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
            <CardDescription>Best performing item categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit Margins</CardTitle>
            <CardDescription>Average profit by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics from your sales data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Sale</p>
              <p className="text-2xl font-bold">$0.00</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">0%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
