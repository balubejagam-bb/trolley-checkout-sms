import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, AlertTriangle, Clock } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    stock_count: number;
    image_url: string;
    category: string;
    last_seen?: string;
  };
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isLowStock = product.stock_count < 10;
  const isOutOfStock = product.stock_count === 0;

  return (
    <Card className="group hover-lift transition-spring glass border-white/20 overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isLowStock && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Low Stock
            </Badge>
          </div>
        )}
        {product.last_seen && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="glass text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(product.last_seen).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary">₹{product.price}</p>
              <p className="text-xs text-muted-foreground">
                Stock: {product.stock_count}
              </p>
            </div>
            
            <Button
              size="sm"
              onClick={() => onAddToCart(product.id)}
              disabled={isOutOfStock}
              className={cn(
                'h-8 w-8 p-0 transition-spring',
                isOutOfStock 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'gradient-primary hover:shadow-lg'
              )}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Badge variant="outline" className="w-fit text-xs">
            {product.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;