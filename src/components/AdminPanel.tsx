import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Save, Printer, Image, Sliders, Check } from 'lucide-react';
import type { Settings, PrintSize, TransformationType } from '../types';

const AdminPanel: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    // Simulate save delay for better UX
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleSettingChange = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-accent-red mb-8 flex items-center">
          <Sliders className="w-8 h-8 mr-2" />
          Booth Settings
        </h2>

        <div className="space-y-8">
          {/* Image Settings */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent-teal flex items-center">
              <Image className="w-6 h-6 mr-2" />
              Image Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transformation Type
                </label>
                <select
                  value={settings.transformationType}
                  onChange={(e) =>
                    handleSettingChange('transformationType', e.target.value as TransformationType)
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-teal focus:ring focus:ring-accent-teal/20"
                >
                  <option value="pencil">Pencil Sketch</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="oilpainting">Oil Painting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Enabled
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.previewEnabled}
                      onChange={(e) =>
                        handleSettingChange('previewEnabled', e.target.checked)
                      }
                      className="h-4 w-4 text-accent-teal focus:ring-accent-teal rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Show preview before printing
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Print Settings */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-accent-teal flex items-center">
              <Printer className="w-6 h-6 mr-2" />
              Print Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print Size
                </label>
                <select
                  value={settings.printSize}
                  onChange={(e) =>
                    handleSettingChange('printSize', e.target.value as PrintSize)
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-teal focus:ring focus:ring-accent-teal/20"
                >
                  <option value="6x9">6x9 inches</option>
                  <option value="8x10">8x10 inches</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print DPI
                </label>
                <select
                  value={settings.printDPI}
                  onChange={(e) =>
                    handleSettingChange('printDPI', Number(e.target.value))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-accent-teal focus:ring focus:ring-accent-teal/20"
                >
                  <option value="300">300 DPI (Recommended)</option>
                  <option value="600">600 DPI (High Quality)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-print
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoprint}
                      onChange={(e) =>
                        handleSettingChange('autoprint', e.target.checked)
                      }
                      className="h-4 w-4 text-accent-teal focus:ring-accent-teal rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Automatically print after transformation
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
              className="bg-primary hover:bg-primary/90 text-black px-8 py-4 rounded-full font-bold shadow-button-3d transform active:translate-y-1 flex items-center space-x-2 disabled:opacity-50"
            >
              {saveStatus === 'saved' ? (
                <Check className="w-6 h-6" />
              ) : (
                <Save className="w-6 h-6" />
              )}
              <span>
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                  ? 'Saved!'
                  : 'Save Settings'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;