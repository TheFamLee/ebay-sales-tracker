"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface Sale {
  id: string
  saleDate: string
  listedDate: string | null
  listedPrice: number
  salePrice: number
  shippingCost: number
  suppliesCost: number
  netProfit: number
  item: {
    id: string
    itemNumber: string
    description: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("saleDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [loading, setLoading] = useState(true)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/sales?${params}`)
      const data = await response.json()

      if (response.ok) {
        setSales(data.sales)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchSales()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
        <p className="text-muted-foreground">
          View and search your historical sales data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>
            {pagination.total} total sales records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by item number or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg font-medium">No sales found</p>
              <p className="text-sm">
                {search
                  ? "Try adjusting your search terms"
                  : "Import your Excel data to see your sales history"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">
                        <Button
                          variant="ghost"
                          className="h-8 p-0 font-semibold"
                          onClick={() => handleSort("saleDate")}
                        >
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Item #</TableHead>
                      <TableHead className="max-w-[300px]">Description</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-8 p-0 font-semibold"
                          onClick={() => handleSort("listedPrice")}
                        >
                          Listed
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-8 p-0 font-semibold"
                          onClick={() => handleSort("salePrice")}
                        >
                          Sold
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Shipping</TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          className="h-8 p-0 font-semibold"
                          onClick={() => handleSort("netProfit")}
                        >
                          Net Profit
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {format(new Date(sale.saleDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {sale.item.itemNumber}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {sale.item.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.listedPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.salePrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.shippingCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={sale.netProfit >= 0 ? "default" : "destructive"}
                            className={sale.netProfit >= 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {formatCurrency(sale.netProfit)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
