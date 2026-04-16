import React from 'react';
import { FileText, Camera, DollarSign, Zap, ShieldCheck } from 'lucide-react';
import FileUpload from './FileUpload.jsx';

const Step2HEC = ({ 
  handleFileUpload, 
  handleNextStep, 
  canProceed 
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          港燈 (HEC) 資料上傳
        </h2>
        <p className="text-lg text-gray-600">
          請提供工程報價單和新設備標籤，AI 將為您自動計算節能潛力
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FileUpload
          onFileUpload={(files) => handleFileUpload('electricity', files)}
          title="上傳電費單"
          description="支持批量上傳 12 個月賬單，用於分析能耗基準 (PDF/JPG/PNG)"
          icon={FileText}
          multiple={true}
          maxFiles={99}
          colorClass="border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50"
          activeClass="border-emerald-500 bg-emerald-50 ring-emerald-500/10"
        />
        <FileUpload
          onFileUpload={(files) => handleFileUpload('oldEfficiency', files)}
          title="上傳舊設備標籤"
          description="舊設備能源效益標籤或銘牌照片，用於識別原始功率 (PDF/JPG/PNG)"
          icon={Camera}
          multiple={true}
          maxFiles={99}
          colorClass="border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50"
          activeClass="border-emerald-500 bg-emerald-50 ring-emerald-500/10"
        />
        <FileUpload
          onFileUpload={(files) => handleFileUpload('efficiency', files)}
          title="上傳新設備標籤"
          description="新設備能源效益標籤照片，用於識別功率及型號 (PDF/JPG/PNG)"
          icon={Camera}
          multiple={true}
          maxFiles={99}
          colorClass="border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50"
          activeClass="border-emerald-500 bg-emerald-50 ring-emerald-500/10"
        />
        <FileUpload
          onFileUpload={(files) => handleFileUpload('financial', files)}
          title="上傳工程報價單"
          description="需包含設備費、安裝費及人工費明細 (PDF/JPG/PNG)"
          icon={DollarSign}
          multiple={true}
          maxFiles={99}
          colorClass="border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50"
          activeClass="border-emerald-500 bg-emerald-50 ring-emerald-500/10"
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
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20'
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

export default Step2HEC;
