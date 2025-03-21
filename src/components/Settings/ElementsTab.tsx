import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { FormatSettings } from '../../types/screenplay';

interface ElementsTabProps {
  settings: FormatSettings;
  setSettings: (settings: FormatSettings) => void;
}

export const ElementsTab: React.FC<ElementsTabProps> = ({
  settings,
  setSettings
}) => {
  const handleChange = (
    elementType: keyof FormatSettings['elements'],
    property: keyof FormatSettings['elements'][keyof FormatSettings['elements']],
    value: string | number
  ) => {
    setSettings({
      ...settings,
      preset: 'custom',
      elements: {
        ...settings.elements,
        [elementType]: {
          ...settings.elements[elementType],
          [property]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium mb-3">Element Formatting</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Customize the alignment and spacing of screenplay elements to match your preferred format.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Element
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alignment
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Width (inches)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spacing Before
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spacing After
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(settings.elements).map(([type, format]) => (
                  <tr key={type} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleChange(type as any, 'alignment', 'left')}
                          className={`p-1.5 rounded ${format.alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleChange(type as any, 'alignment', 'center')}
                          className={`p-1.5 rounded ${format.alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleChange(type as any, 'alignment', 'right')}
                          className={`p-1.5 rounded ${format.alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                          title="Align Right"
                        >
                          <AlignRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0.5"
                          max="6"
                          step="0.1"
                          value={format.width}
                          onChange={(e) => handleChange(type as any, 'width', parseFloat(e.target.value))}
                          className="w-16 px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="ml-1">in</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.25"
                          value={format.spacingBefore}
                          onChange={(e) => handleChange(type as any, 'spacingBefore', parseFloat(e.target.value))}
                          className="w-16 px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="ml-1">rem</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="3"
                          step="0.25"
                          value={format.spacingAfter}
                          onChange={(e) => handleChange(type as any, 'spacingAfter', parseFloat(e.target.value))}
                          className="w-16 px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="ml-1">rem</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-medium mb-3">Preset Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSettings({
              ...settings,
              preset: 'standard',
              elements: {
                'scene-heading': { alignment: 'left', width: 6, spacingBefore: 1.5, spacingAfter: 1 },
                'action': { alignment: 'left', width: 6, spacingBefore: 0, spacingAfter: 1 },
                'character': { alignment: 'center', width: 3.5, spacingBefore: 1, spacingAfter: 0.25 },
                'parenthetical': { alignment: 'center', width: 2.5, spacingBefore: 0, spacingAfter: 0 },
                'dialogue': { alignment: 'left', width: 3.5, spacingBefore: 0, spacingAfter: 1 },
                'transition': { alignment: 'right', width: 6, spacingBefore: 1, spacingAfter: 1 }
              }
            })}
            className={`p-4 border rounded-lg text-left ${settings.preset === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            <h4 className="font-medium">Standard Format</h4>
            <p className="text-sm text-gray-600 mt-1">Industry standard screenplay format</p>
          </button>
          <button
            onClick={() => setSettings({
              ...settings,
              preset: 'compact',
              elements: {
                'scene-heading': { alignment: 'left', width: 6, spacingBefore: 1, spacingAfter: 0.5 },
                'action': { alignment: 'left', width: 6, spacingBefore: 0, spacingAfter: 0.5 },
                'character': { alignment: 'center', width: 3.5, spacingBefore: 0.5, spacingAfter: 0 },
                'parenthetical': { alignment: 'center', width: 2.5, spacingBefore: 0, spacingAfter: 0 },
                'dialogue': { alignment: 'left', width: 3.5, spacingBefore: 0, spacingAfter: 0.5 },
                'transition': { alignment: 'right', width: 6, spacingBefore: 0.5, spacingAfter: 0.5 }
              }
            })}
            className={`p-4 border rounded-lg text-left ${settings.preset === 'compact' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            <h4 className="font-medium">Compact Format</h4>
            <p className="text-sm text-gray-600 mt-1">Reduced spacing for more content per page</p>
          </button>
        </div>
      </div>
    </div>
  );
};