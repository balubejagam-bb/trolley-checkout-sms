import { AlertTriangle, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface UnbilledItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  weight: number;
}

interface UnbilledItemsAlertProps {
  items: UnbilledItem[];
  onAddItem: (itemId: string) => void;
  onAddAll: () => void;
  onDismiss: () => void;
}

const UnbilledItemsAlert = ({ items, onAddItem, onAddAll, onDismiss }: UnbilledItemsAlertProps) => {
  if (items.length === 0) return null;

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Card className="glass border-red-500/50 shadow-lg shadow-red-500/25 animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Unbilled Items Detected
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Message */}
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm font-medium text-red-500">
            {items.length} item{items.length > 1 ? 's' : ''} in your basket {items.length > 1 ? 'are' : 'is'} not billed
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Would you like to add {items.length > 1 ? 'them' : 'it'} to your bill?
          </p>
        </div>

        {/* Items List */}
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div 
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg glass border-white/10 hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.barcode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.weight}kg
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">₹{item.price.toFixed(2)}</p>
                  <Button
                    size="sm"
                    onClick={() => onAddItem(item.id)}
                    className="mt-1 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary and Actions */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="text-lg font-bold text-primary">₹{totalValue.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onAddAll}
              className="flex-1 gradient-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add All Items
            </Button>
            <Button 
              variant="outline"
              onClick={onDismiss}
              className="glass border-white/20"
            >
              Ignore
            </Button>
          </div>
        </div>

        {/* Warning Footer */}
        <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-500">
            Items not added to the bill may result in incomplete checkout. Please verify your basket.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnbilledItemsAlert;
