import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    barcode: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    gst_percent: number;
    image_url: string;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCartItems();
  }, [user, navigate]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          quantity,
          product:products(
            id,
            barcode,
            name,
            brand,
            category,
            price,
            gst_percent,
            image_url
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Error loading cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Error updating quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      fetchCartItems();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Error removing item');
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    cartItems.forEach(item => {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      gstAmount += (itemTotal * item.product.gst_percent) / 100;
    });

    return {
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: (subtotal + gstAmount).toFixed(2)
    };
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/scan')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">Start scanning products to add them to your cart</p>
              <Button onClick={() => navigate('/scan')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                        <Badge variant="secondary" className="mt-1">
                          {item.product.category}
                        </Badge>
                        <div className="mt-2">
                          <p className="font-semibold text-primary">₹{item.product.price}</p>
                          <p className="text-sm text-muted-foreground">GST: {item.product.gst_percent}%</p>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-semibold">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>₹{gstAmount}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">₹{total}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;