import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirmOne: () => void;
  onConfirmAll?: () => void;
  onClose: () => void;
  confirmOneText: string;
  confirmAllText?: string;
  isLoadingOne: boolean;
  isLoadingAll?: boolean;
  variant?: 'primary' | 'danger';
}

export function ConfirmDialog({
  title,
  message,
  onConfirmOne,
  onConfirmAll,
  onClose,
  confirmOneText,
  confirmAllText,
  isLoadingOne,
  isLoadingAll,
  variant = 'primary'
}: ConfirmDialogProps) {
  const colorClasses = {
    primary: {
      title: 'text-purple-600',
      buttonOutline: 'border-purple-600 text-purple-600 hover:bg-purple-50',
      buttonFilled: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    danger: {
      title: 'text-red-600',
      buttonOutline: 'border-red-600 text-red-600 hover:bg-red-50',
      buttonFilled: 'bg-red-600 hover:bg-red-700 text-white',
    },
  }[variant];

  return (
    <div className="absolute inset-0 bg-white rounded-lg p-6 z-10">
      <div className="flex justify-between items-start mb-4">
        <h4 className={`text-lg font-semibold ${colorClasses.title}`}>{title}</h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          disabled={isLoadingOne || isLoadingAll}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-sm text-gray-700 mb-6">{message}</p>
      
      <div className="flex flex-col space-y-3">
        {onConfirmAll && confirmAllText ? (
          <>
            <button
              onClick={onConfirmOne}
              disabled={isLoadingOne || isLoadingAll}
              className={`w-full px-4 py-2 text-sm font-medium border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.buttonOutline}`}
            >
              {isLoadingOne ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </span>
              ) : (
                confirmOneText
              )}
            </button>
            
            <button
              onClick={onConfirmAll}
              disabled={isLoadingOne || isLoadingAll}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.buttonFilled}`}
            >
              {isLoadingAll ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </span>
              ) : (
                confirmAllText
              )}
            </button>
          </>
        ) : (
          <button
            onClick={onConfirmOne}
            disabled={isLoadingOne}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses.buttonFilled}`}
          >
            {isLoadingOne ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </span>
            ) : (
              confirmOneText
            )}
          </button>
        )}
      </div>
    </div>
  );
}