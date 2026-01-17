"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface ImportResult {
  salesCreated: number
  inventoryCreated: number
  depositsCreated: number
  errors: string[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      setFile(droppedFile)
      setResult(null)
      setError(null)
    } else {
      setError("Please upload an Excel file (.xlsx or .xls)")
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Import failed")
        return
      }

      setResult(data.results)
    } catch {
      setError("An error occurred during import")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Import Data</h2>
        <p className="text-muted-foreground">
          Upload your Excel files to import historical sales data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Upload your existing Excel spreadsheet to import sales history, inventory, and deposit records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-500"> or drag and drop</span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Excel files only (.xlsx, .xls)
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Data"
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Import Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{result.salesCreated} sales records imported</li>
                  <li>{result.inventoryCreated} inventory items imported</li>
                  <li>{result.depositsCreated} deposit records imported</li>
                </ul>
                {result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-yellow-700">Warnings:</p>
                    <ul className="list-disc list-inside text-yellow-600">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Excel Formats</CardTitle>
          <CardDescription>
            The importer recognizes these sheet structures from your Excel files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">eBay Sales Sheets</h4>
              <p className="text-sm text-muted-foreground">
                Sheets containing &quot;eBay&quot;, year numbers (2024, 2025), or &quot;sold&quot; in the name.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Expected columns:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Item # / Item Number</li>
                  <li>Description</li>
                  <li>Listed Price / Sale Price</li>
                  <li>Shipping Cost</li>
                  <li>Supplies Cost</li>
                  <li>Date Listed / Date Sold</li>
                  <li>Net Profit</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Items to Sell Sheet</h4>
              <p className="text-sm text-muted-foreground">
                Sheets containing &quot;items to sell&quot; or &quot;inventory&quot; in the name.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Expected columns:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Item # (optional)</li>
                  <li>Description</li>
                  <li>Minimum Internet Price</li>
                  <li>Cost</li>
                  <li>Date</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">USB Deposit Sheet</h4>
              <p className="text-sm text-muted-foreground">
                Sheets containing &quot;USB&quot; or &quot;deposit&quot; in the name.
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Expected columns:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Sold Date</li>
                  <li>Description</li>
                  <li>Total</li>
                  <li>Net Profit</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Sold by Me Sheet</h4>
              <p className="text-sm text-muted-foreground">
                Sheets containing &quot;sold by me&quot; in the name (e.g., PLAYMOBIL sales).
              </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Expected columns:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Date</li>
                  <li>Item #</li>
                  <li>Description</li>
                  <li>Total</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
