import React from 'react';
import { DollarSign, Leaf, Clock, Award, Info } from 'lucide-react';
import ResultCard from './ResultCard.jsx';
import PDFReportGeneratorHEC from './PDFReportHEC.jsx';
import ComparisonChart from './ComparisonChart.jsx';
import SensitivityAnalysis from './SensitivityAnalysis.jsx';

const Step4HEC = ({ 
  reportData,
  onExportXLSX,
  electricityPriceIncrease,
  onPriceIncreaseChange,
  operatingHours,
  onHoursChange
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          港燈 (HEC) 節能效益分析報告
        </h2>
        <p className="text-lg text-gray-600">
          基於 AI 分析結果，為您提供詳細的節能效益評估
        </p>
      </div>

      {/* 申報期限警告 */}
      {(reportData.isExpired || reportData.isExpiringSoon) && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 border-2 ${
          reportData.isExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <Info className="w-6 h-6" />
          <div>
            <p className="font-bold">
              {reportData.isExpired ? '申請期限已過' : '申請期限即將屆滿'}
            </p>
            <p className="text-sm opacity-90">
              港燈要求在購買設備後 12 個月內遞交申請。您的購買日期為 {reportData.purchaseDate}。
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
          color="bg-emerald-500"
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
          color="bg-emerald-600"
          delay={0.6}
          subtitle={`資助比例: ${(reportData.subsidyRate * 100).toFixed(0)}%`}
        />
      </div>

      {/* 補貼資格徽章 */}
      <div className="flex justify-center space-x-4">
        {reportData.eligibleForSubsidy && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800">
            <Award className="w-5 h-5" />
            <span className="font-medium">符合港燈節能設備資助</span>
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
        <h3 className="text-xl font-bold text-slate-900 mb-8">預計申報流程 (港燈)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          
          {[
            { step: '01', title: '能源審核', desc: '完成港燈智惜用電能源審核服務', status: 'ready' },
            { step: '02', title: '提交申請', desc: '完成項目後 1 年內，電郵申請表及文件至 SME@hkelectric.com', status: 'pending' },
            { step: '03', title: '發放資助', desc: '項目後查核完成後，資助將發放至指定電力賬戶', status: 'pending' },
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-emerald-600 text-white">
                {item.step}
              </div>
              <h4 className="font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 px-4 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
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
            <h3 className="text-xl font-bold text-slate-900">下一步：準備申請</h3>
            <p className="text-slate-500 text-sm">您可以下載節能效益分析報告或自動生成的Excel申報表格</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onExportXLSX('zh')}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm"
              >
                下載Excel表格
              </button>
            </div>
            <PDFReportGeneratorHEC data={reportData} />
          </div>
        </div>

        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h4 className="font-bold text-emerald-900 mb-4 flex items-center">
            <Info className="w-4 h-4 mr-2" /> 港燈申報提醒
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="text-sm font-bold text-emerald-900">資助比例與上限</h5>
              <ul className="text-xs text-emerald-800 space-y-2 list-disc list-inside">
                <li>資助額通常為合資格項目費用的 60%。</li>
                <li>若已完成強制性能源審核，資助比率上調至 80%。</li>
                <li>每個合資格處所資助上限為 HK$150,000。</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h5 className="text-sm font-bold text-emerald-900">設備專項上限</h5>
              <ul className="text-xs text-emerald-800 space-y-2 list-disc list-inside">
                <li>LED 燈膽/筒燈：每盞 HK$20</li>
                <li>LED 光管/燈帶/燈盤：每件 HK$60</li>
                <li>1級能源標籤冷氣：每台 HK$2,500</li>
                <li>高效率冷氣/熱能回收：每套 HK$10,000</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200/50">
            <p className="text-xs text-emerald-700 italic">
              * 需保留所有發票正本及新舊設備照片以備抽查。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4HEC;
