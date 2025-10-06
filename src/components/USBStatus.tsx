import React, { useState, useEffect } from 'react';
import { Usb, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface USBStatusProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const USBStatus = ({ onConnect, onDisconnect }: USBStatusProps) => {
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>('No device connected');

  // Simulate USB connection check
  useEffect(() => {
    // Check for USB device support
    if ('usb' in navigator) {
      checkUSBConnection();
    } else {
      toast.error('USB API not supported in this browser');
    }
  }, []);

  const checkUSBConnection = async () => {
    // Simulate checking for connected devices
    // In production, this would use navigator.usb.getDevices()
    setDeviceInfo('Checking for devices...');
    setTimeout(() => {
      setDeviceInfo('Ready to connect');
    }, 1000);
  };

  const handleConnect = async () => {
    try {
      setScanning(true);
      
      // Simulate USB device connection
      // In production, this would use navigator.usb.requestDevice()
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnected(true);
      setDeviceInfo('URTF Scanner Model X1');
      setLastScan(new Date());
      toast.success('USB URTF Reader connected successfully');
      onConnect?.();
    } catch (error) {
      toast.error('Failed to connect USB device');
      console.error('USB connection error:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setDeviceInfo('Device disconnected');
    setLastScan(null);
    toast.info('USB URTF Reader disconnected');
    onDisconnect?.();
  };

  const handleRefresh = () => {
    if (connected) {
      setLastScan(new Date());
      toast.success('Scan completed');
    }
  };

  return (
    <Card className="glass border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Usb className="h-5 w-5 text-primary" />
            USB URTF Reader
          </div>
          <Badge 
            variant={connected ? "default" : "secondary"} 
            className={connected ? "bg-green-500" : ""}
          >
            {connected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Connected</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Disconnected</>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="p-3 rounded-lg glass border-white/10">
          <p className="text-sm text-muted-foreground mb-1">Device Status</p>
          <p className="font-medium">{deviceInfo}</p>
        </div>

        {/* Last Scan Time */}
        {lastScan && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Scan</span>
            <span className="font-medium">
              {lastScan.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!connected ? (
            <Button 
              onClick={handleConnect} 
              disabled={scanning}
              className="flex-1 gradient-primary"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Usb className="h-4 w-4 mr-2" />
                  Connect Device
                </>
              )}
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                className="flex-1 glass border-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan Now
              </Button>
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                className="glass border-white/20"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
          <span>{connected ? 'Active scanning mode' : 'Waiting for connection'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default USBStatus;
