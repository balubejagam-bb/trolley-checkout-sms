import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Package, BarChart3, TrendingUp, Users, ShoppingCart } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/scan');
      return;
    }
    fetchStats();
  }, [user, isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch orders count and revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount');

      // Fetch unique customers count
      const { count: customersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        totalCustomers: customersCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have admin privileges</p>
          <Button onClick={() => navigate('/scan')}>
            Back to Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/scan')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active inventory items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total sales amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => navigate('/admin/products')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Manage Products
              </CardTitle>
              <CardDescription>
                Add, edit, and manage your product inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Go to Products
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/admin/analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                View Analytics
              </CardTitle>
              <CardDescription>
                Sales reports, trends, and business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <CardDescription>
                View customer data and purchase history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders and system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Recent activity will be displayed here</p>
              <p className="text-sm">Feature coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;