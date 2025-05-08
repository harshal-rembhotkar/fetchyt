
import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BackendStatus = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const checkBackendConnection = async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('http://localhost:8080/api/info?url=test', {
        method: 'GET',
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      setIsConnected(!!response);
      setShowAlert(!response);
    } catch (error) {
      setIsConnected(false);
      setShowAlert(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendConnection();
  }, []);

  if (!showAlert) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Backend Server Not Connected</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          Cannot connect to the download server. To use FetchYT, please make sure the Go backend is running on port 8080.
        </p>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={checkBackendConnection}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Connection'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BackendStatus;
