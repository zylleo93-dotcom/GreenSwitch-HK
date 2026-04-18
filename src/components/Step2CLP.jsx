import React from 'react';
import { FileText, Camera, DollarSign, Info, Zap, ShieldCheck } from 'lucide-react';
import FileUpload from './FileUpload.jsx';

const Step2CLP = ({ 
  installationType, 
  setInstallationType, 
  handleFileUpload, 
  handleNextStep, 
  canProceed 
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          中電 (CLP) 資料上傳
        </h2>
        <p className="text-lg text-gray-600">
          請提供設備發票和新設備標籤，AI 將為您自動計算節能潛力
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-amber-600" />
          <span className="text-amber-900 font-bold">申請類型：</span>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-amber-200">
          <button
            onClick={() => setInstallationType('replacement')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${installationType === 'replacement' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            舊設備更換
          </button>
          <button
            onClick={() => setInstallationType('new')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${installationType === 'new' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            全新添置
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${installationType === 'replacement' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        <FileUpload
          onFileUpload={(files) => handleFileUpload('electricity', files)}
          title="上傳電費單"
          description="支持批量上傳 12 個月賬單，用於分析能耗基準 (PDF/JPG/PNG)"
          icon={FileText}
          multiple={true}
          maxFiles={99}
          colorClass="border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
          activeClass="border-amber-500 bg-amber-50 ring-amber-500/10"
        />
        {installationType === 'replacement' && (
          <FileUpload
            onFileUpload={(files) => handleFileUpload('oldEfficiency', files)}
            title="上傳舊設備標籤"
            description="舊設備能源效益標籤或銘牌照片，用於識別原始功率 (PDF/JPG/PNG)"
            icon={Camera}
            multiple={true}
            maxFiles={99}
            colorClass="border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
            activeClass="border-amber-500 bg-amber-50 ring-amber-500/10"
          />
        )}
        <FileUpload
          onFileUpload={(files) => handleFileUpload('efficiency', files)}
          title="上傳新設備標籤"
          description="新設備能源效益標籤照片，用於識別功率及型號 (PDF/JPG/PNG)"
          icon={Camera}
          multiple={true}
          maxFiles={99}
          colorClass="border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
          activeClass="border-amber-500 bg-amber-50 ring-amber-500/10"
        />
        <FileUpload
          onFileUpload={(files) => handleFileUpload('financial', files)}
          title="上傳新設備發票"
          description="需清晰顯示設備型號及單價 (PDF/JPG/PNG)"
          icon={DollarSign}
          multiple={true}
          maxFiles={99}
          colorClass="border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
          activeClass="border-amber-500 bg-amber-50 ring-amber-500/10"
        />
      </div>

      <div className="flex justify-center">
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">
            您的數據已加密處理，僅用於 AI 分析，符合香港《個人資料（隱私）條例》
          </span>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handleNextStep}
          disabled={!canProceed}
          className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 ${
            canProceed
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-xl shadow-amber-600/20'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>開始 AI 智能分析</span>
          <Zap className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Step2CLP;
