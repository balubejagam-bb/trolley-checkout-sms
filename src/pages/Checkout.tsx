import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, QrCode, Check } from 'lucide-react';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    barcode: string;
    name: string;
    brand: string;
    price: number;
    gst_percent: number;
  };
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
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
            price,
            gst_percent
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Error loading cart');
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
      subtotal,
      gstAmount,
      total: subtotal + gstAmount
    };
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  const handleCustomerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone) {
      toast.error('Phone number is required');
      return;
    }
    setStep('payment');
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber) {
      toast.error('Please enter UTR number');
      return;
    }

    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          customer_name: customerName || null,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          subtotal,
          gst_amount: gstAmount,
          total_amount: total,
          utr_number: utrNumber,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        barcode: item.product.barcode,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        gst_percent: item.product.gst_percent,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: cartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user!.id);

      if (cartError) throw cartError;

      setOrderId(order.id);
      setStep('success');
      toast.success('Payment successful! Receipt generated.');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const generateUPIQR = () => {
    const upiId = '7993650197@paytm';
    const amount = total.toFixed(2);
    const upiUrl = `upi://pay?pa=${upiId}&pn=Smart%20Trolley&am=${amount}&cu=INR&tn=Payment%20for%20Order`;
    return upiUrl;
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your order has been placed successfully.
              </p>
              <div className="space-y-4">
                <Button onClick={() => navigate(`/receipt/${orderId}`)}>
                  View Receipt
                </Button>
                <Button variant="outline" onClick={() => navigate('/scan')}>
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/cart')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomerDetails} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Continue to Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>UPI Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block border">
                    <QrCode className="h-32 w-32 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Scan to pay ₹{total.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    UPI ID: 7993650197@paytm
                  </p>
                </div>

                {/* Payment Form */}
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="utr">UTR/Transaction ID *</Label>
                    <Input
                      id="utr"
                      placeholder="Enter UTR number after payment"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST:</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;