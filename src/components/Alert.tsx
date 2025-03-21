// src/components/Alert.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number; // in milliseconds
}

const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  autoClose = true,
  autoCloseTime = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, isVisible, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
      default:
        return 'bg-blue-50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
      default:
        return 'border-blue-400';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-md border ${getBorderColor()} ${getBackgroundColor()} p-4 shadow-lg animate-fade-in max-w-md`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className={`inline-flex rounded-md p-1.5 ${getBackgroundColor()} ${getTextColor()} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getBorderColor()}`}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert context for global alert management
import { createContext, useContext } from 'react';

interface AlertContextType {
  showAlert: (type: AlertType, message: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
  };

  const hideAlert = () => {
    setAlert(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alert && <Alert type={alert.type} message={alert.message} onClose={hideAlert} />}
    </AlertContext.Provider>
  );
};