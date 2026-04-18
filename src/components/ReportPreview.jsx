import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Leaf, 
  Award, 
  Info,
  Building2,
  Calendar
} from 'lucide-react';

const ReportPreview = ({ data, utility = 'CLP' }) => {
  const isCLP = utility === 'CLP';
  const themeColor = isCLP ? 'text-amber-600' : 'text-emerald-600';
  const bgColor = isCLP ? 'bg-amber-600' : 'bg-emerald-600';
  const lightBg = isCLP ? 'bg-amber-50' : 'bg-emerald-50';
  const borderColor = isCLP ? 'border-amber-200' : 'border-emerald-200';

  const today = new Date().toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-[800px] mx-auto bg-slate-50 p-4 md:p-8 rounded-3xl shadow-inner border border-slate-200">
      <div className="bg-white shadow-2xl rounded-sm overflow-hidden aspect-[1/1.414] flex flex-col relative">
        {/* PDF Header Decoration */}
        <div className={`h-2 ${bgColor} w-full`} />
        
        {/* Page 1: Cover */}
        <div className="p-12 flex flex-col h-full">
          <div className="flex justify-between items-start mb-20">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                <Leaf className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-800">GreenSwitch HK</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Report ID</p>
              <p className="text-xs font-mono text-slate-600">GS-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className="text-5xl font-black text-slate-900 leading-tight">
                節能設備更換及<br />
                <span className={themeColor}>{isCLP ? '中電 (CLP)' : '港燈 (HEC)'}</span> 補貼分析報告
              </h1>
              <div className={`h-1 w-24 ${bgColor} rounded-full`} />
              <p className="text-lg text-slate-500 max-w-md">
                基於 AI 智能識別技術生成的專業能源效益評估，旨在優化您的電力成本並獲取最大政府/電力公司資助。
              </p>
            </motion.div>

            <div className="mt-20 grid grid-cols-2 gap-12">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">客戶行業</p>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <p className="text-sm font-bold text-slate-800">{data.industry || '一般商業'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">報告日期</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <p className="text-sm font-bold text-slate-800">{today}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-400">© 2024 GreenSwitch Hong Kong. All rights reserved.</p>
              <p className="text-[10px] text-slate-300 mt-1">此報告由 AI 輔助生成，最終審批權歸電力公司所有。</p>
            </div>
            <div className={`px-4 py-2 ${lightBg} rounded-lg border ${borderColor}`}>
              <p className={`text-[10px] font-bold ${themeColor} uppercase tracking-wider`}>Verified Analysis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2: Executive Summary */}
      <div className="mt-8 bg-white shadow-2xl rounded-sm overflow-hidden aspect-[1/1.414] flex flex-col p-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <Award className={`w-6 h-6 mr-2 ${themeColor}`} />
            執行摘要 (Executive Summary)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Page 02</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className={`${lightBg} p-6 rounded-2xl border ${borderColor} relative overflow-hidden group`}>
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-500 mb-1">預計總補貼金額</p>
              <p className={`text-3xl font-black ${themeColor}`}>HK$ {Math.round(data.estimatedSubsidy).toLocaleString()}</p>
            </div>
            <Award className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 ${themeColor}`} />
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 mb-1">年度節省電費</p>
              <p className="text-3xl font-black text-white">HK$ {Math.round(data.annualSavings).toLocaleString()}</p>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 text-white" />
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <div className={`w-1.5 h-4 ${bgColor} rounded-full mr-2`} />
              核心效益指標
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">年度節電量</p>
                <p className="text-lg font-black text-slate-800">{Math.round(data.annualSavingsKWh).toLocaleString()} <span className="text-xs font-normal">kWh</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">投資回收期</p>
                <p className="text-lg font-black text-slate-800">{data.paybackPeriod.toFixed(1)} <span className="text-xs font-normal">個月</span></p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">減碳貢獻</p>
                <p className="text-lg font-black text-emerald-600">{data.carbonReduction.toFixed(2)} <span className="text-xs font-normal text-slate-400">tCO2e</span></p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
              <div className={`w-1.5 h-4 ${bgColor} rounded-full mr-2`} />
              環境影響可視化
            </h3>
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-center space-x-8">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-10 h-10 bg-white rounded-full border-2 border-emerald-100 flex items-center justify-center shadow-sm">
                    <Leaf className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  您的節能行為相當於每年為地球種植了 <span className="font-bold text-emerald-600">{(data.carbonReduction * 45).toFixed(0)}</span> 棵樹，
                  或減少了 <span className="font-bold text-emerald-600">{(data.carbonReduction * 0.2).toFixed(1)}</span> 輛私家車的年度碳排放。
                </p>
              </div>
            </div>
          </section>

          <section className="mt-auto">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">專業建議 (Next Steps)</p>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  根據數據分析，您的項目具有極高的投資回報率。建議立即準備發票及設備照片，並在購買後 6 個月內提交申請以確保獲取補貼。
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
