import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ScanLine, ShoppingCart, Plus, LogOut, User, Search, 
  Filter, Truck, Battery, Wifi, Activity, TrendingUp,
  Clock, Package, Zap 
} from 'lucide-react';
import StatusChip from '@/components/StatusChip';
import BatteryRing from '@/components/BatteryRing';
import ProductCard from '@/components/ProductCard';
import TrolleyMap from '@/components/TrolleyMap';

interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  gst_percent: number;
  stock_count: number;
  image_url: string;
}

const Scan = () => {
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [trolleyStatus, setTrolleyStatus] = useState({
    online: true,
    battery: 78,
    speed: 3.2,
    location: 'Zone A-3',
    items: 12
  });
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCartCount();
    fetchProducts();
    
    // Simulate real-time trolley updates
    const interval = setInterval(() => {
      setTrolleyStatus(prev => ({
        ...prev,
        battery: Math.max(20, prev.battery + (Math.random() > 0.5 ? 1 : -1)),
        speed: Math.max(0, Math.min(5, prev.speed + (Math.random() - 0.5) * 0.5)),
        items: prev.items + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCartCount = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('cart')
      .select('quantity')
      .eq('user_id', user.id);
    
    if (!error && data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) {
      toast.error('Please enter a barcode');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Product not found');
        setScannedProduct(null);
      } else {
        setScannedProduct(data);
        toast.success('Product found!');
      }
    } catch (error) {
      console.error('Error scanning product:', error);
      toast.error('Error scanning product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) return;

    try {
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1
          });

        if (error) throw error;
      }

      toast.success('Added to cart!');
      fetchCartCount();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding to cart');
    }
  };

  const addScannedToCart = async () => {
    if (!scannedProduct || !user) return;
    await addToCart(scannedProduct.id);
    setBarcode('');
    setScannedProduct(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative">
      {/* Header with Glass Effect */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg animate-pulse"></div>
                <div className="relative bg-white/10 p-2 rounded-lg glass">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Smart Trolley
                </h1>
                <p className="text-xs text-muted-foreground">Intelligent Shopping System</p>
              </div>
            </div>

            {/* Status Chips */}
            <div className="hidden md:flex items-center gap-2">
              <StatusChip 
                status={trolleyStatus.online ? "online" : "offline"}
                label={trolleyStatus.online ? "Online" : "Offline"}
                pulse={trolleyStatus.online}
              />
              <StatusChip 
                status={trolleyStatus.battery > 30 ? "online" : "warning"}
                label="Battery"
                value={`${trolleyStatus.battery}%`}
              />
              <StatusChip 
                status="online"
                label="Items"
                value={trolleyStatus.items}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="glass border-white/20">
                  <User className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/cart')} className="glass border-white/20">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({cartCount})
              </Button>
              <Button variant="outline" onClick={handleLogout} className="glass border-white/20">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Scanner and Products */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Dashboard Header */}
            <Card className="glass border-white/20 gradient-hero relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/5"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Smart Trolley Dashboard</h2>
                    <p className="text-muted-foreground">Real-time inventory and trolley management</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <BatteryRing percentage={trolleyStatus.battery} size="lg" />
                  </div>
                </div>
                
                {/* Real-time KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass p-4 rounded-lg border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Orders Today</span>
                    </div>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="glass p-4 rounded-lg border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span className="text-sm text-muted-foreground">Avg Delivery</span>
                    </div>
                    <p className="text-2xl font-bold">3.2m</p>
                  </div>
                  <div className="glass p-4 rounded-lg border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-sm text-muted-foreground">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold">99.2%</p>
                  </div>
                  <div className="glass p-4 rounded-lg border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Speed</span>
                    </div>
                    <p className="text-2xl font-bold">{trolleyStatus.speed.toFixed(1)}m/s</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanner Section */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  Product Scanner
                </CardTitle>
                <CardDescription>Scan barcode or search products manually</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleScan} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter barcode (e.g., 8901030877651)"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      disabled={loading}
                      className="glass bg-white/5 border-white/20"
                    />
                    <Button type="submit" disabled={loading} className="gradient-primary">
                      {loading ? 'Scanning...' : 'Scan'}
                    </Button>
                  </div>
                </form>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 glass bg-white/5 border-white/20"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="glass border-white/20">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scanned Product Display */}
            {scannedProduct && (
              <Card className="glass border-white/20 border-primary/50 shadow-lg shadow-primary/25">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        src={scannedProduct.image_url}
                        alt={scannedProduct.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full">
                        <Zap className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{scannedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">{scannedProduct.brand}</p>
                      <Badge variant="secondary" className="mt-1">
                        {scannedProduct.category}
                      </Badge>
                      <div className="mt-2 space-y-1">
                        <p className="text-2xl font-bold text-primary">₹{scannedProduct.price}</p>
                        <p className="text-sm text-muted-foreground">GST: {scannedProduct.gst_percent}%</p>
                        <p className="text-sm text-muted-foreground">Stock: {scannedProduct.stock_count}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <Button 
                        onClick={addScannedToCart} 
                        disabled={scannedProduct.stock_count === 0}
                        className="gradient-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Products</span>
                  <Badge variant="outline" className="glass">
                    {filteredProducts.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="aspect-square bg-muted/20 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={addToCart}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trolley Control & Map */}
          <div className="space-y-6">
            
            {/* Trolley Status Card */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Trolley Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Current Location</p>
                    <p className="text-sm text-muted-foreground">{trolleyStatus.location}</p>
                  </div>
                  <StatusChip 
                    status={trolleyStatus.online ? "online" : "offline"}
                    label={trolleyStatus.online ? "Active" : "Inactive"}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <BatteryRing percentage={trolleyStatus.battery} />
                    <p className="text-sm mt-2">Battery</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p className="font-bold">{trolleyStatus.speed.toFixed(1)} m/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Items</p>
                      <p className="font-bold">{trolleyStatus.items}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1 gradient-primary">
                    Start Route
                  </Button>
                  <Button variant="outline" className="flex-1 glass border-white/20">
                    Return
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trolley Map */}
            <TrolleyMap />

            {/* Recent Activity */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '2 min ago', action: 'Product added to cart', item: 'Organic Milk' },
                    { time: '5 min ago', action: 'Route updated', item: 'Zone A-3 → B-1' },
                    { time: '8 min ago', action: 'Item scanned', item: 'Wheat Bread' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg glass border-white/10">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.item}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/20 p-4">
        <div className="flex gap-2">
          <Button onClick={() => navigate('/cart')} className="flex-1 gradient-primary">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cartCount})
          </Button>
          <Button variant="outline" className="glass border-white/20" disabled>
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Scan;