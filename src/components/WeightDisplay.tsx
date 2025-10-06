import { Scale, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface WeightDisplayProps {
  currentWeight: number;
  expectedWeight: number;
  tolerance: number;
  status: 'match' | 'mismatch' | 'warning';
}

const WeightDisplay = ({ currentWeight, expectedWeight, tolerance, status }: WeightDisplayProps) => {
  const discrepancy = Math.abs(currentWeight - expectedWeight);
  const discrepancyPercentage = expectedWeight > 0 ? (discrepancy / expectedWeight) * 100 : 0;
  
  const statusConfig = {
    match: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Weight Match',
      message: 'All items accounted for'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Minor Discrepancy',
      message: 'Within tolerance range'
    },
    mismatch: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Weight Mismatch',
      message: 'Please verify all items'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="glass border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Weight Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${config.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${config.color}`} />
          <div className="flex-1">
            <p className={`font-semibold ${config.color}`}>{config.label}</p>
            <p className="text-sm text-muted-foreground">{config.message}</p>
          </div>
        </div>

        {/* Weight Readings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Weight</p>
            <p className="text-2xl font-bold text-primary">{currentWeight.toFixed(2)} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Expected Weight</p>
            <p className="text-2xl font-bold">{expectedWeight.toFixed(2)} kg</p>
          </div>
        </div>

        {/* Discrepancy Indicator */}
        {discrepancy > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discrepancy</span>
              <span className={`font-semibold ${status === 'match' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                {discrepancy.toFixed(2)} kg ({discrepancyPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={Math.min(discrepancyPercentage, 100)} 
              className="h-2"
            />
          </div>
        )}

        {/* Tolerance Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded bg-muted/30">
          <span>Tolerance Range</span>
          <Badge variant="outline" className="glass">
            ±{(tolerance * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightDisplay;
