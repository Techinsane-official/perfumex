"use client";

import { useEffect, useState } from "react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

interface DashboardStatsProps {
  statistics: {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    productsSold: number;
    totalProducts: number;
    totalCustomers: number;
    period: number;
    startDate: string;
    endDate: string;
  };
}

export default function DashboardStats({ statistics }: DashboardStatsProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for charts
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Pie chart data for revenue breakdown
  const revenueData = {
    labels: ['Revenue', 'Remaining'],
    datasets: [
      {
        data: [statistics.totalRevenue, Math.max(0, 100000 - statistics.totalRevenue)], // Assuming 100k target
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green
          'rgba(229, 231, 235, 0.8)', // Gray
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(229, 231, 235, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Pie chart data for order status distribution
  const orderData = {
    labels: ['Orders', 'Potential'],
    datasets: [
      {
        data: [statistics.totalOrders, Math.max(0, 200 - statistics.totalOrders)], // Assuming 200 order target
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(229, 231, 235, 0.8)', // Gray
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(229, 231, 235, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Line chart data for trends (mock data for now)
  const trendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Revenue Trend',
        data: [
          statistics.totalRevenue * 0.7,
          statistics.totalRevenue * 0.8,
          statistics.totalRevenue * 0.9,
          statistics.totalRevenue
        ],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Orders Trend',
        data: [
          statistics.totalOrders * 0.6,
          statistics.totalOrders * 0.8,
          statistics.totalOrders * 0.9,
          statistics.totalOrders
        ],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{statistics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last {statistics.period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last {statistics.period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statistics.activeCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Out of {statistics.totalCustomers} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Products Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.productsSold.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From {statistics.totalProducts} available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Revenue progress vs target (€100,000)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={revenueData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Orders Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Progress</CardTitle>
            <CardDescription>
              Orders progress vs target (200 orders)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={orderData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>
            Revenue and orders trend over the last 4 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={trendData} options={lineOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 