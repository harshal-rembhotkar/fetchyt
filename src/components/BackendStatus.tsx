
import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BackendStatus = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [serverAddress, setServerAddress] = useState('195.88.71.182:8080');

  const checkBackendConnection = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${serverAddress}/api/info?url=test`, {
        method: 'GET',
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      if (response && response.ok) {
        setIsConnected(true);
        setShowAlert(false);
        toast.success('Backend Connected', {
          description: `Successfully connected to the backend server at ${serverAddress}.`,
        });
      } else {
        setIsConnected(false);
        setShowAlert(true);
        toast.error('Backend Connection Failed', {
          description: `Could not connect to the server at ${serverAddress}. Please check if the server is running.`,
        });
      }
    } catch (error) {
      setIsConnected(false);
      setShowAlert(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendConnection();
  }, [serverAddress]);

  if (!showAlert) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Backend Server Not Connected</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Cannot connect to the download server at <strong>{serverAddress}</strong>. 
          To use FetchYT, please make sure the Go backend is running and accessible.
        </p>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkBackendConnection}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Check Connection'}
            </Button>
            <div className="flex items-center gap-2 border px-3 py-1 rounded-md">
              <label htmlFor="serverAddress" className="text-sm font-medium">Server:</label>
              <input
                id="serverAddress"
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                className="bg-transparent border-none p-0 text-sm focus:outline-none w-40"
                placeholder="hostname:port"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            If your server is running but not connecting, check for network or firewall issues.
            Make sure your backend is configured to accept cross-origin requests from {window.location.origin}.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BackendStatus;
