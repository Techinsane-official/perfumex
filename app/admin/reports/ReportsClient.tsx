"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Download,
  Calendar,
  Filter
} from "lucide-react";

interface ReportData {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  href: string;
}

const reports: ReportData[] = [
  {
    id: "sales",
    name: "Sales Reports",
    description: "Revenue, orders, and sales performance",
    icon: TrendingUp,
    color: "bg-green-100 text-green-600",
    href: "/admin/reports/sales"
  },
  {
    id: "inventory",
    name: "Inventory Reports", 
    description: "Stock levels, product performance, and inventory analytics",
    icon: Package,
    color: "bg-blue-100 text-blue-600",
    href: "/admin/reports/inventory"
  },
  {
    id: "customers",
    name: "Customer Reports",
    description: "Customer behavior, demographics, and loyalty metrics",
    icon: Users,
    color: "bg-purple-100 text-purple-600",
    href: "/admin/reports/customers"
  },
  {
    id: "orders",
    name: "Order Reports",
    description: "Order processing, fulfillment, and delivery analytics",
    icon: ShoppingCart,
    color: "bg-orange-100 text-orange-600",
    href: "/admin/reports/orders"
  },
  {
    id: "financial",
    name: "Financial Reports",
    description: "Profit margins, costs, and financial performance",
    icon: DollarSign,
    color: "bg-emerald-100 text-emerald-600",
    href: "/admin/reports/financial"
  },
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Custom reports and data visualization",
    icon: BarChart3,
    color: "bg-indigo-100 text-indigo-600",
    href: "/admin/reports/analytics"
  }
];

export default function ReportsClient() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    productsSold: 0,
    period: 30,
    startDate: "",
    endDate: ""
  });
  const [loading, setLoading] = useState(true);

  // Fetch real statistics when component mounts or period changes
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/reports/statistics?period=${selectedPeriod}`);
        if (response.ok) {
          const data = await response.json();
          setStatistics(data);
        } else {
          console.error("Failed to fetch statistics");
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedPeriod]);

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId);
    // For now, show an alert that this feature is coming soon
    alert(`${reportId.charAt(0).toUpperCase() + reportId.slice(1)} reports are coming soon! This will show detailed analytics and charts.`);
  };

  const handleExport = (reportId: string) => {
    // For now, show an alert that export is coming soon
    alert(`Export functionality for ${reportId} reports is coming soon! This will allow you to download reports in PDF, Excel, or CSV format.`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure report parameters and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Format
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Charts
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleReportClick(report.id)}
                    className="w-full"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleExport(report.id)}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

             {/* Quick Stats */}
       <Card>
         <CardHeader>
           <CardTitle>Quick Statistics</CardTitle>
           <CardDescription>
             Key metrics for the last {statistics.period} days ({new Date(statistics.startDate).toLocaleDateString()} - {new Date(statistics.endDate).toLocaleDateString()})
           </CardDescription>
         </CardHeader>
         <CardContent>
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                   <div className="h-8 bg-gray-200 rounded mb-2"></div>
                   <div className="h-4 bg-gray-200 rounded"></div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="text-center p-4 bg-green-50 rounded-lg">
                 <div className="text-2xl font-bold text-green-600">
                   €{statistics.totalRevenue.toLocaleString()}
                 </div>
                 <div className="text-sm text-gray-600">Total Revenue</div>
               </div>
               <div className="text-center p-4 bg-blue-50 rounded-lg">
                 <div className="text-2xl font-bold text-blue-600">
                   {statistics.totalOrders.toLocaleString()}
                 </div>
                 <div className="text-sm text-gray-600">Total Orders</div>
               </div>
               <div className="text-center p-4 bg-purple-50 rounded-lg">
                 <div className="text-2xl font-bold text-purple-600">
                   {statistics.activeCustomers.toLocaleString()}
                 </div>
                 <div className="text-sm text-gray-600">Active Customers</div>
               </div>
               <div className="text-center p-4 bg-orange-50 rounded-lg">
                 <div className="text-2xl font-bold text-orange-600">
                   {statistics.productsSold.toLocaleString()}
                 </div>
                 <div className="text-sm text-gray-600">Products Sold</div>
               </div>
             </div>
           )}
         </CardContent>
       </Card>
    </div>
  );
} 