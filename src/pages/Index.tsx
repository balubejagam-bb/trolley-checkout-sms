import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Scan, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/scan');
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p>Loading Smart Trolley...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShoppingCart className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl">Smart Trolley</CardTitle>
          <CardDescription>Auto Billing System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Button onClick={() => navigate('/login')} size="lg">
              Get Started
            </Button>
            <Button variant="outline" onClick={() => navigate('/signup')} size="lg">
              Create Account
            </Button>
          </div>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <Scan className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Barcode Scanning</p>
            </div>
            <div>
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Smart Cart</p>
            </div>
            <div>
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Auto Billing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
