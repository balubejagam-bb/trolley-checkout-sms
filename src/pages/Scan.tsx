import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScanLine, ShoppingCart, Plus, Minus, LogOut, User } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCartCount();
  }, [user, navigate]);

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

  const addToCart = async () => {
    if (!scannedProduct || !user) return;

    try {
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', scannedProduct.id)
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
            product_id: scannedProduct.id,
            quantity: 1
          });

        if (error) throw error;
      }

      toast.success('Added to cart!');
      fetchCartCount();
      setBarcode('');
      setScannedProduct(null);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding to cart');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ScanLine className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Smart Trolley</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <User className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cartCount})
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Product</CardTitle>
            <CardDescription>Enter barcode or scan using camera/USB scanner</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <Input
                placeholder="Enter barcode (e.g., 8901030877651)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Scanning...' : 'Scan Product'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scanned Product */}
        {scannedProduct && (
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <img
                  src={scannedProduct.image_url}
                  alt={scannedProduct.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{scannedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{scannedProduct.brand}</p>
                  <Badge variant="secondary" className="mt-1">
                    {scannedProduct.category}
                  </Badge>
                  <div className="mt-2 space-y-1">
                    <p className="text-xl font-bold text-primary">₹{scannedProduct.price}</p>
                    <p className="text-sm text-muted-foreground">GST: {scannedProduct.gst_percent}%</p>
                    <p className="text-sm text-muted-foreground">Stock: {scannedProduct.stock_count}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <Button onClick={addToCart} disabled={scannedProduct.stock_count === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={() => navigate('/cart')} className="h-16">
            <ShoppingCart className="h-6 w-6 mr-2" />
            View Cart ({cartCount})
          </Button>
          <Button variant="outline" className="h-16" disabled>
            <ScanLine className="h-6 w-6 mr-2" />
            Camera Scan (Soon)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Scan;