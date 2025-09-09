import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalGST: number;
  averageOrderValue: number;
  topSellingProducts: {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
  recentOrders: {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    created_at: string;
  }[];
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalGST: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/scan');
      return;
    }
    fetchAnalytics();
  }, [user, isAdmin, navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const orders = ordersData || [];
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const totalGST = orders.reduce((sum, order) => sum + Number(order.gst_amount), 0);
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Fetch top selling products
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, total_price')
        .order('created_at', { ascending: false });

      if (topProductsError) throw topProductsError;

      // Aggregate top selling products
      const productMap = new Map();
      (topProductsData || []).forEach(item => {
        const existing = productMap.get(item.product_name) || {
          product_name: item.product_name,
          total_quantity: 0,
          total_revenue: 0
        };
        existing.total_quantity += item.quantity;
        existing.total_revenue += Number(item.total_price);
        productMap.set(item.product_name, existing);
      });

      const topSellingProducts = Array.from(productMap.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders: orders.length,
        totalGST,
        averageOrderValue,
        topSellingProducts,
        recentOrders: orders.slice(0, 10)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <Button onClick={() => navigate('/scan')}>Back to Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{analytics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All time sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total GST Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{analytics.totalGST.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Tax amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₹{analytics.averageOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Most popular items by quantity sold</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topSellingProducts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topSellingProducts.map((product, index) => (
                    <div key={product.product_name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.total_quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">₹{product.total_revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>No sales data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {order.customer_name || 'Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">₹{Number(order.total_amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          #{order.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Reports</CardTitle>
            <CardDescription>More detailed analytics and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" disabled>
                Sales by Category
              </Button>
              <Button variant="outline" disabled>
                Monthly Trends
              </Button>
              <Button variant="outline" disabled>
                Customer Analytics
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Advanced reporting features coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;