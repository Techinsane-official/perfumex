'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  TrendingUp, 
  Filter,
  Calendar,
  Download,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import PriceResultsTable from '@/components/scraping/PriceResultsTable';
import { PriceScrapingResult, NormalizedProductData } from '@/lib/scraping/types';

interface ResultsPageProps {}

export default function ResultsPage({}: ResultsPageProps) {
  const router = useRouter();
  const [results, setResults] = useState<PriceScrapingResult[]>([]);
  const [normalizedProducts, setNormalizedProducts] = useState<NormalizedProductData[]>([]);
  const [apiAnalytics, setApiAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch price scraping results
        const response = await fetch('/api/admin/scraping/price-results?limit=100');
        if (!response.ok) {
          throw new Error('Failed to fetch price results');
        }
        
        const data = await response.json();
        if (data.success && data.results) {
          setResults(data.results);
          
          // Extract normalized products from results
          const products = data.results
            .map((result: any) => result.normalizedProduct)
            .filter(Boolean)
            .filter((product: any, index: number, self: any[]) => 
              self.findIndex(p => p.id === product.id) === index
            );
          
          setNormalizedProducts(products);
          
          // Set API analytics if available
          if (data.analytics) {
            setApiAnalytics(data.analytics);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to empty arrays if API fails
        setResults([]);
        setNormalizedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = (format: 'csv' | 'json') => {
    if (results.length === 0) return;

    if (format === 'csv') {
      const headers = ['Product', 'Brand', 'Merchant', 'Price', 'Currency', 'Confidence', 'Date', 'URL'];
      const csvContent = [
        headers.join(','),
        ...results.map(result => {
          const product = normalizedProducts.find(p => p.id === result.normalizedProductId);
          return [
            `"${product?.productName || 'Unknown'}"`,
            `"${product?.brand || 'Unknown'}"`,
            `"${result.merchant || 'Unknown'}"`,
            result.price || '0',
            result.currency || 'EUR',
            result.confidenceScore || '0',
            result.scrapedAt ? new Date(result.scrapedAt).toLocaleDateString() : 'Unknown',
            `"${result.url || 'Unknown'}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scraping-results-${dateRange}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scraping-results-${dateRange}-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Fetch fresh data from API
      const response = await fetch('/api/admin/scraping/price-results?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch price results');
      }
      
      const data = await response.json();
      if (data.success && data.results) {
        setResults(data.results);
        
        // Extract normalized products from results
        const products = data.results
          .map((result: any) => result.normalizedProduct)
          .filter(Boolean)
          .filter((product: any, index: number, self: any[]) => 
            self.findIndex(p => p.id === product.id) === index
          );
        
        setNormalizedProducts(products);
        
        // Set API analytics if available
        if (data.analytics) {
          setApiAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredResults = () => {
    if (dateRange === 'all') return results;
    
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    } as const;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days[dateRange]);
    
    return results.filter(result => new Date(result.scrapedAt) >= cutoffDate);
  };

  const getAnalytics = () => {
    const filteredResults = getFilteredResults();
    
    if (filteredResults.length === 0) return null;
    
    const totalProducts = new Set(filteredResults.map(r => r.normalizedProductId)).size;
    const totalSources = new Set(filteredResults.map(r => r.merchant)).size;
    const averagePrice = filteredResults.reduce((sum, r) => sum + parseFloat(String(r.price || '0')), 0) / filteredResults.length;
    const highConfidenceCount = filteredResults.filter(r => parseFloat(String(r.confidenceScore || '0')) >= 0.8).length;
    
    // Calculate margin opportunities
    const opportunities = filteredResults.filter(result => {
      const product = normalizedProducts.find(p => p.id === result.normalizedProductId);
      if (!product) return false;
      
      const wholesalePrice = parseFloat(String(product.wholesalePrice || '0'));
      const retailPrice = parseFloat(String(result.price || '0'));
      const margin = retailPrice - wholesalePrice;
      const marginPercentage = wholesalePrice > 0 ? (margin / wholesalePrice) * 100 : 0;
      
      return margin > 0 && marginPercentage >= 20;
    }).length;
    
    return {
      totalResults: filteredResults.length,
      totalProducts,
      totalSources,
      averagePrice: averagePrice.toFixed(2),
      highConfidenceCount,
      opportunities,
      dateRange
    };
  };

  // Use API analytics if available, otherwise calculate locally
  const analytics = apiAnalytics || getAnalytics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/scraping')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scraping
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraping Results</h1>
              <p className="text-gray-800">Browse and analyze historical price scraping data</p>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Overview
                <Badge variant="outline" className="ml-2">
                  {dateRange === '7d' ? 'Last 7 days' : 
                   dateRange === '30d' ? 'Last 30 days' : 
                   dateRange === '90d' ? 'Last 90 days' : 'All time'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalResults}</div>
                  <div className="text-sm text-blue-600">Total Results</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.productsCount || analytics.totalProducts}</div>
                  <div className="text-sm text-green-600">Products</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.sourcesCount || analytics.totalSources}</div>
                  <div className="text-sm text-purple-600">Sources</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">€{analytics.averagePrice}</div>
                  <div className="text-sm text-yellow-600">Avg Price</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{analytics.highConfidenceCount}</div>
                  <div className="text-sm text-indigo-600">High Confidence</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{analytics.opportunitiesCount || analytics.opportunities}</div>
                  <div className="text-sm text-orange-600">Opportunities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Controls */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">Date Range:</span>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-900"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                
                <Badge variant="outline" className="text-sm">
                  {getFilteredResults().length} results
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <PriceResultsTable
          results={getFilteredResults()}
          normalizedProducts={normalizedProducts}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
