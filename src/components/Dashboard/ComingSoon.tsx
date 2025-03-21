import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  section: string;
}

export default function ComingSoon({ section }: ComingSoonProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center py-16">
        <Construction className="h-16 w-16 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {section} Coming Soon
        </h2>
        <p className="text-gray-600">
          We're working hard to bring you this feature. Stay tuned!
        </p>
      </div>
    </div>
  );
}