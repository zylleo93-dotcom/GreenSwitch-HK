import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

const SensitivityAnalysis = ({ 
  electricityPriceIncrease, 
  onPriceIncreaseChange, 
  operatingHours, 
  onHoursChange,
  baseSavings,
  baseElectricityPrice // Add this prop
}) => {
  const calculateAdjustedSavings = () => {
    const priceMultiplier = 1 + electricityPriceIncrease / 100;
    const hoursMultiplier = operatingHours / 8; // 基于8小时基准
    return baseSavings * priceMultiplier * hoursMultiplier;
  };

  const adjustedSavings = calculateAdjustedSavings();
  const savingsChange = ((adjustedSavings - baseSavings) / baseSavings) * 100;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">敏感性分析</h3>
        <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center">
          <span className="text-xs text-slate-500">識別電價基準: </span>
          <span className="text-xs font-bold text-slate-700 ml-1">${baseElectricityPrice?.toFixed(2)} / kWh</span>
          {baseElectricityPrice === 1.2 && (
            <span className="ml-2 text-[9px] text-slate-400 font-normal">(AI 未能識別，使用默認值)</span>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <TrendingUp className="w-4 h-4" />
              <span>電費漲幅 (%)</span>
            </label>
            <span className="text-sm font-medium text-emerald-600">
              {electricityPriceIncrease}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={electricityPriceIncrease}
            onChange={(e) => onPriceIncreaseChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
              <Clock className="w-4 h-4" />
              <span>每日運行時數</span>
            </label>
            <span className="text-sm font-medium text-emerald-600">
              {operatingHours}小時
            </span>
          </div>
          <input
            type="range"
            min="4"
            max="24"
            value={operatingHours}
            onChange={(e) => onHoursChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>4小時</span>
            <span>24小時</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">調整後年節省</span>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">
                ${adjustedSavings.toLocaleString()}
              </div>
              <div className={`text-sm ${savingsChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {savingsChange >= 0 ? '+' : ''}{savingsChange.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitivityAnalysis;
