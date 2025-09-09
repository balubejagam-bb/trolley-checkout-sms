import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Download, Share2, Printer } from 'lucide-react';

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  utr_number: string;
  created_at: string;
  order_items: {
    barcode: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    gst_percent: number;
    total_price: number;
  }[];
}

const Receipt = () => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !id) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [user, id, navigate]);

  const fetchOrder = async () => {
    if (!user || !id) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      setOrder({
        ...orderData,
        order_items: itemsData
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error loading receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, you'd generate a PDF here
    toast.info('PDF download feature coming soon');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Smart Trolley Receipt',
        text: `Receipt for order ${order?.id}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Receipt link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Receipt not found</h2>
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
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/scan')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Receipt</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Smart Trolley</CardTitle>
            <p className="text-sm text-muted-foreground">Auto Billing System</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Receipt No:</p>
                <p className="text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="font-semibold">Date & Time:</p>
                <p className="text-sm">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="font-semibold mb-2">Customer Details:</h3>
              <div className="space-y-1 text-sm">
                {order.customer_name && <p>Name: {order.customer_name}</p>}
                <p>Phone: {order.customer_phone}</p>
                {order.customer_email && <p>Email: {order.customer_email}</p>}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-2">Items:</h3>
              <div className="space-y-2">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-muted-foreground">
                        {item.barcode} | GST: {item.gst_percent}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{item.quantity} x ₹{item.unit_price}</p>
                      <p className="font-medium">₹{item.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{order.gst_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-primary">₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-semibold mb-2">Payment Details:</h3>
              <div className="space-y-1 text-sm">
                <p>Method: UPI</p>
                <p>UTR: {order.utr_number}</p>
                <p>Status: Completed</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>Thank you for shopping with Smart Trolley!</p>
              <p>Receipt auto-sent to registered phone/email</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Receipt;