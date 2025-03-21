import React from 'react';
import { Layers } from 'lucide-react';
import { FormatSettings, PageLayout } from '../../types/screenplay';

interface PageLayoutTabProps {
  settings: FormatSettings;
  setSettings: (settings: FormatSettings) => void;
}

export const PageLayoutTab: React.FC<PageLayoutTabProps> = ({
  settings,
  setSettings
}) => {
  const handlePageLayoutChange = (property: keyof PageLayout, value: string | number | boolean) => {
    setSettings({
      ...settings,
      preset: 'custom',
      pageLayout: {
        ...settings.pageLayout,
        [property]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium mb-3">Page Layout</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            Customize the page dimensions and margins for your screenplay.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Page Size</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paper Format
                  </label>
                  <select
                    value={settings.pageLayout.paperSize}
                    onChange={(e) => handlePageLayoutChange('paperSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="letter">US Letter (8.5" × 11")</option>
                    <option value="a4">A4 (210mm × 297mm)</option>
                    <option value="legal">Legal (8.5" × 14")</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="5"
                        max="12"
                        step="0.1"
                        value={settings.pageLayout.width}
                        onChange={(e) => handlePageLayoutChange('width', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={settings.pageLayout.paperSize !== 'custom'}
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="7"
                        max="17"
                        step="0.1"
                        value={settings.pageLayout.height}
                        onChange={(e) => handlePageLayoutChange('height', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={settings.pageLayout.paperSize !== 'custom'}
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handlePageLayoutChange('paperSize', 'custom')}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    Use custom dimensions
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Margins</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Top
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.pageLayout.marginTop}
                        onChange={(e) => handlePageLayoutChange('marginTop', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bottom
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.pageLayout.marginBottom}
                        onChange={(e) => handlePageLayoutChange('marginBottom', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Left
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.pageLayout.marginLeft}
                        onChange={(e) => handlePageLayoutChange('marginLeft', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Right
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={settings.pageLayout.marginRight}
                        onChange={(e) => handlePageLayoutChange('marginRight', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2">in</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Page Numbering</h4>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.pageLayout.showPageNumbers}
                    onChange={(e) => handlePageLayoutChange('showPageNumbers', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show page numbers</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Number Position
                </label>
                <select
                  value={settings.pageLayout.pageNumberPosition}
                  onChange={(e) => handlePageLayoutChange('pageNumberPosition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!settings.pageLayout.showPageNumbers}
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Page Layout Preview</h4>
            <div className="border border-gray-300 rounded-md p-4 bg-white flex justify-center">
              <div 
                className="bg-white border border-gray-300 shadow-sm relative"
                style={{
                  width: `${Math.min(settings.pageLayout.width * 20, 170)}px`,
                  height: `${Math.min(settings.pageLayout.height * 20, 220)}px`,
                }}
              >
                <div 
                  className="absolute bg-blue-50 border border-blue-200"
                  style={{
                    top: `${settings.pageLayout.marginTop * 20}px`,
                    left: `${settings.pageLayout.marginLeft * 20}px`,
                    right: `${settings.pageLayout.marginRight * 20}px`,
                    bottom: `${settings.pageLayout.marginBottom * 20}px`,
                  }}
                >
                  {/* Content area */}
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="text-blue-300 w-6 h-6" />
                  </div>
                </div>
                
                {/* Page number indicator */}
                {settings.pageLayout.showPageNumbers && (
                  <div 
                    className="absolute text-xs text-gray-500 px-1"
                    style={{
                      top: settings.pageLayout.pageNumberPosition.startsWith('top') ? '4px' : 'auto',
                      bottom: settings.pageLayout.pageNumberPosition.startsWith('bottom') ? '4px' : 'auto',
                      left: settings.pageLayout.pageNumberPosition.endsWith('center') ? '50%' : 'auto',
                      right: settings.pageLayout.pageNumberPosition.endsWith('right') ? '4px' : 'auto',
                      transform: settings.pageLayout.pageNumberPosition.endsWith('center') ? 'translateX(-50%)' : 'none',
                    }}
                  >
                    1.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-md font-medium mb-3">Preset Page Layouts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSettings({
              ...settings,
              pageLayout: {
                paperSize: 'letter',
                width: 8.5,
                height: 11,
                marginTop: 1,
                marginBottom: 1,
                marginLeft: 1.5,
                marginRight: 1,
                showPageNumbers: true,
                pageNumberPosition: 'top-right'
              }
             })}
            className={`p-4 border rounded-lg text-left ${
              settings.pageLayout.paperSize === 'letter' &&
              settings.pageLayout.marginTop === 1 &&
              settings.pageLayout.marginLeft === 1.5
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <h4 className="font-medium">US Screenplay Standard</h4>
            <p className="text-sm text-gray-600 mt-1">US Letter with industry standard margins</p>
          </button>
          <button
            onClick={() => setSettings({
              ...settings,
              pageLayout: {
                paperSize: 'a4',
                width: 8.27,
                height: 11.69,
                marginTop: 1,
                marginBottom: 1,
                marginLeft: 1.5,
                marginRight: 1,
                showPageNumbers: true,
                pageNumberPosition: 'top-right'
              }
            })}
            className={`p-4 border rounded-lg text-left ${
              settings.pageLayout.paperSize === 'a4' &&
              settings.pageLayout.marginTop === 1 &&
              settings.pageLayout.marginLeft === 1.5
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <h4 className="font-medium">European Screenplay Standard</h4>
            <p className="text-sm text-gray-600 mt-1">A4 with industry standard margins</p>
          </button>
        </div>
      </div>
    </div>
  );
};