import React from 'react';
import { Coffee, Store, Building, Factory, Warehouse, ShoppingBag } from 'lucide-react';

const IndustrySelector = ({ selectedIndustry, onIndustryChange, operatingHours, onHoursChange, utility, clpType, onClpTypeChange }) => {
  const industries = {
    nonResidential: [
      { id: 'restaurant', name: '茶餐廳', icon: Coffee, defaultHours: 12, description: '餐飲業，長時間運作' },
      { id: 'retail', name: '便利店', icon: Store, defaultHours: 16, description: '零售業，幾乎全天運作' },
      { id: 'office', name: '辦公室', icon: Building, defaultHours: 8, description: '商業辦公，標準工時' },
    ],
    largeHighDemand: [
      { id: 'factory', name: '製造工廠', icon: Factory, defaultHours: 10, description: '工業生產，高耗能設備' },
      { id: 'warehouse', name: '大型物流中心', icon: Warehouse, defaultHours: 24, description: '倉儲物流，全天候運作' },
      { id: 'mall', name: '大型商場', icon: ShoppingBag, defaultHours: 14, description: '綜合商業，高空調需求' },
    ]
  };

  const currentIndustries = utility === 'CLP' && clpType === 'largeHighDemand' 
    ? industries.largeHighDemand 
    : industries.nonResidential;

  const handleIndustrySelect = (industry) => {
    onIndustryChange(industry.id);
    onHoursChange(industry.defaultHours);
  };

  return (
    <div className="space-y-6">
      {utility === 'CLP' && (
        <div>
          <label className="block text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">02a. 選擇用電類型</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onClpTypeChange('nonResidential')}
              className={`p-4 rounded-xl border-2 transition-all ${clpType === 'nonResidential' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}
            >
              非住宅用電
            </button>
            <button
              onClick={() => onClpTypeChange('largeHighDemand')}
              className={`p-4 rounded-xl border-2 transition-all ${clpType === 'largeHighDemand' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}
            >
              大量用電或高需求用電
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">選擇您的行業類型</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentIndustries.map((industry) => {
            const Icon = industry.icon;
            return (
              <button
                key={industry.id}
                onClick={() => handleIndustrySelect(industry)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  selectedIndustry === industry.id
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="w-6 h-6 text-slate-600" />
                  <span className="font-medium text-slate-900">{industry.name}</span>
                </div>
                <p className="text-sm text-gray-600">{industry.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          每日運行時數
        </label>
        <input
          type="number"
          value={operatingHours}
          onChange={(e) => onHoursChange(Number(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          min="1"
          max="24"
        />
        <p className="text-xs text-gray-500 mt-1">根據行業類型自動設定，可手動調整</p>
      </div>
    </div>
  );
};

export default IndustrySelector;
