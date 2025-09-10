import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Truck } from 'lucide-react';

const TrolleyMap: React.FC = () => {
  return (
    <Card className="glass border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Trolley Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Placeholder */}
        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg relative overflow-hidden mb-4">
          {/* Animated Trolley Marker */}
          <div className="absolute top-1/3 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full w-8 h-8 animate-ping"></div>
              <div className="relative bg-primary text-white p-2 rounded-full shadow-lg">
                <Truck className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          {/* Route Path */}
          <svg className="absolute inset-0 w-full h-full">
            <path
              d="M 20 80 Q 100 20 180 60"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10,5"
              className="animate-pulse"
            />
          </svg>
          
          {/* Destination Markers */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-secondary text-white p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          
          <div className="absolute top-4 left-4">
            <div className="bg-accent text-black p-2 rounded-full shadow-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start glass border-white/20">
            <Navigation className="h-4 w-4 mr-2" />
            Go to Trolley
          </Button>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Current Zone: A-3</div>
            <div>ETA: 2 mins</div>
            <div>Speed: 3.2 m/s</div>
            <div>Distance: 25m</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrolleyMap;