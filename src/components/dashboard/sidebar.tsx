"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  History,
  ShoppingCart,
  PlusCircle,
  Upload,
  Settings,
  Bell,
  TrendingUp,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales History", href: "/dashboard/sales", icon: History },
  { name: "Active Listings", href: "/dashboard/listings", icon: ShoppingCart },
  { name: "New Listing", href: "/dashboard/new-listing", icon: PlusCircle },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Import Data", href: "/dashboard/import", icon: Upload },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ShoppingCart className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold">eBay Tracker</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center px-4 py-2 text-sm text-gray-400">
          <span>eBay Sales Tracker v1.0</span>
        </div>
      </div>
    </div>
  )
}
