import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  email: string;
  onChangeDisplayName: () => void;
  onChangeEmail: () => void;
}

export function AccountSettingsModal({
  isOpen,
  onClose,
  displayName,
  email,
  onChangeDisplayName,
  onChangeEmail
}: AccountSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Modal */}
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-gray-50 text-gray-900 shadow-xl transition-all"
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-8 pt-6 pb-8">
            <h2 className="text-2xl font-bold mb-2">Account Info</h2>
            <p className="text-gray-600 mb-6">
              Your name and profile picture will be visible to your collaborators.
            </p>

            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <div className="text-lg">{displayName}</div>
                </div>
                <button
                  onClick={onChangeDisplayName}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="text-lg">{email}</div>
                </div>
                <button
                  onClick={onChangeEmail}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium text-gray-700"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}