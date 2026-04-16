import React from 'react';
import { DollarSign, Leaf, Clock, Award, Info, ExternalLink } from 'lucide-react';
import ResultCard from './ResultCard.jsx';
import PDFReportGeneratorCLP from './PDFReportCLP.jsx';
import ComparisonChart from './ComparisonChart.jsx';
import SensitivityAnalysis from './SensitivityAnalysis.jsx';

const Step4CLP = ({ 
  reportData, 
  onExportXLSX,
  electricityPriceIncrease,
  onPriceIncreaseChange,
  operatingHours,
  onHoursChange,
  clpType
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          中電 (CLP) 節能效益分析報告
        </h2>
        <p className="text-lg text-gray-600">
          基於 AI 分析結果，為您提供詳細的節能效益評估
        </p>
      </div>

      {/* 申報期限警告 */}
      {(reportData.isExpired || reportData.isExpiringSoon) && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 border-2 ${
          reportData.isExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <Info className="w-6 h-6" />
          <div>
            <p className="font-bold">
              {reportData.isExpired ? '申請期限已過' : '申請期限即將屆滿'}
            </p>
            <p className="text-sm opacity-90">
              中電要求在購買設備後 6 個月內遞交申請。您的購買日期為 {reportData.purchaseDate}。
            </p>
          </div>
        </div>
      )}

      {/* 核心指標卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ResultCard
          title="預計年省電費"
          value={reportData.annualSavings}
          unit="HKD"
          icon={DollarSign}
          color="bg-amber-500"
          delay={0}
        />
        <ResultCard
          title="預計年減碳量"
          value={reportData.carbonReduction}
          unit="噸 CO2e"
          icon={Leaf}
          color="bg-green-600"
          delay={0.2}
        />
        <ResultCard
          title="投資回報周期"
          value={reportData.paybackPeriod}
          unit="個月"
          icon={Clock}
          color="bg-blue-500"
          delay={0.4}
        />
        <ResultCard
          title="預估獲批資助"
          value={reportData.estimatedSubsidy}
          unit="HKD"
          icon={Award}
          color="bg-amber-600"
          delay={0.6}
          subtitle={`資助比例: ${(reportData.subsidyRate * 100).toFixed(0)}%`}
        />
      </div>

      {/* 補貼資格徽章 */}
      <div className="flex justify-center space-x-4">
        {reportData.eligibleForSubsidy && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800">
            <Award className="w-5 h-5" />
            <span className="font-medium">符合中電節能設備資助</span>
          </div>
        )}
        {reportData.eligibleForGreenLoan && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <Award className="w-5 h-5" />
            <span className="font-medium">符合HSBC綠色貸款</span>
          </div>
        )}
      </div>

      {/* 圖表分析 */}
      <ComparisonChart data={reportData} />

      {/* 申報流程時間線 */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-8">預計申報流程 (中電)</h3>
        
        {clpType === 'nonResidential' ? (
          <div>
            <h4 className="font-bold text-slate-700 mb-6">非住宅用電</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
              
              {[
                { step: '01', title: '安裝後申請', desc: '遞交網上申請表' },
                { step: '02', title: '安裝後檢查', desc: '完成安裝後安排抽樣檢查' },
                { step: '03', title: '收取資助', desc: '批核後資助直接存入電力賬戶' },
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-slate-200 text-slate-600">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-bold text-slate-700 mb-6">大量用電或高需求用電</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
              
              {[
                { step: '01', title: '安裝前檢查', desc: '客戶經理安排檢查現有節能設備' },
                { step: '02', title: '安裝合資格設備', desc: '確認設備符合資格後進行安裝' },
                { step: '03', title: '提交所需文件', desc: '提交發票、收據及設備資料' },
                { step: '04', title: '安裝後檢查', desc: '完成安裝後安排抽樣檢查' },
                { step: '05', title: '收取資助', desc: '批核後資助直接存入電力賬戶' },
              ].map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-slate-200 text-slate-600">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 px-4">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 敏感性分析 */}
      <SensitivityAnalysis
        electricityPriceIncrease={electricityPriceIncrease}
        onPriceIncreaseChange={onPriceIncreaseChange}
        operatingHours={operatingHours}
        onHoursChange={onHoursChange}
        baseSavings={reportData.annualSavings}
      />

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900">下一步：准备申請</h3>
            <p className="text-slate-500 text-sm">您可以下載節能效益分析報告或自動生成的Excel申報表格</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onExportXLSX()}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center space-x-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>下载Excel表格</span>
            </button>
            <PDFReportGeneratorCLP data={reportData} />
          </div>
        </div>

        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
          <h4 className="font-bold text-amber-900 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2" /> 中電申報提醒
          </h4>
          <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
            <li>計劃適用於 2024 年 1 月 1 日至 2028 年 12 月 31 日期間購買的合資格設備。</li>
            <li>LED 燈膽/筒燈每件資助 $20 或單價 80% (以較低值為準)；LED 光管/燈帶/燈盤每件資助 $60 或單價 80% (以較低值為準)；一級冷氣機每台資助 $1,000 或單價 80% (以較低值為準)。</li>
            <li>其他節能裝置按節電量計算，每一度電 (kWh) 獲得港幣 $0.5 資助。</li>
            <li>非住宅賬戶上限 $10,000；大量用電賬戶上限 $200,000。</li>
            <li>每年只可為每一類產品類別申請一次，需保留發票正本及新舊設備照片。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step4CLP;
