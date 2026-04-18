import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Leaf, Award, ChevronLeft, Zap, ArrowRight, ShieldCheck, ChevronDown, ExternalLink, ChevronRight } from 'lucide-react';
import WizardStepper from '../components/WizardStepper.jsx';
import IndustrySelector from '../components/IndustrySelector.jsx';
import DataVerificationCLP from '../components/DataVerificationCLP.jsx';
import DataVerificationHEC from '../components/DataVerificationHEC.jsx';
import Step4CLP from '../components/Step4CLP.jsx';
import Step4HEC from '../components/Step4HEC.jsx';
import { calculateBatchSavings, generateReportData } from '../utils/mockAI.js';
import * as XLSX from 'xlsx';

const SubsidyGuideDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null); // 'clp' or null
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clpLinks = [
    {
      label: '非住宅用電',
      url: 'https://www.clp.com.hk/content/dam/clphk/documents/my-business-site/low-carbon-solutions/eeus/EEUS_NRT%20Application%20Guideline_bilingual_2025.pdf'
    },
    {
      label: '大量用電或高需求用電',
      url: 'https://www.clp.com.hk/content/dam/clphk/documents/my-business-site/low-carbon-solutions/eeus/EEUS_BTLPT%20Application%20Guideline_bilingual_2025.pdf'
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
      >
        <span>資助指南</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-visible z-[100]"
          >
            <div className="p-2 space-y-1">
              {/* CLP Option */}
              <div
                className="relative"
                onMouseEnter={() => setActiveSubMenu('clp')}
                onMouseLeave={() => setActiveSubMenu(null)}
              >
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeSubMenu === 'clp' ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>中電 (CLP)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* CLP Submenu */}
                <AnimatePresence>
                  {activeSubMenu === 'clp' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute right-full top-0 mr-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 space-y-1"
                    >
                      {clpLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* HEC Option */}
              <a
                href="https://www.hkelectric.com/documents/zh/CustomerServices/SmartPowerServices/Documents/EEES%20Guide%20to%20Application%20ZH.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
              >
                <span>港燈 (HEC)</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OfficialWebsiteDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
      >
        <span>官网详情</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[100]"
          >
            <div className="p-2 space-y-1">
              <a
                href="https://www.clp.com.hk/zh/business/low-carbon-solutions/funds-and-subsidies/electrical-equipment-upgrade-scheme"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
              >
                <span>中電 (CLP)</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="https://www.hkelectric.com/sc/smart-power/energy-management/energy-efficient-equipment-subsidy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
              >
                <span>港燈 (HEC)</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [clpType, setClpType] = useState('nonResidential');
  const [operatingHours, setOperatingHours] = useState(8);
  const [analysisData, setAnalysisData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [electricityPriceIncrease, setElectricityPriceIncrease] = useState(0);
  const [utility, setUtility] = useState('HEC');
  const [installationType, setInstallationType] = useState('replacement'); // 'replacement' | 'new'

  const steps = ['選擇電力公司和行業類型', '資料上傳與數據確認', '下載使用'];

  const [globalFilesCLP, setGlobalFilesCLP] = useState({
    electricity: [],
    efficiency: [],
    oldEfficiency: [],
    financial: []
  });

  const [globalFilesHEC, setGlobalFilesHEC] = useState({
    electricity: [],
    efficiency: [],
    oldEfficiency: [],
    financial: []
  });

  const handleFileUploadCLP = (type, files, isAppend = false) => {
    if (!files) return;
    const fileArray = files instanceof FileList ? Array.from(files) : (Array.isArray(files) ? files : [files]);
    setGlobalFilesCLP(prev => ({
      ...prev,
      [type]: isAppend ? [...prev[type], ...fileArray] : fileArray
    }));
  };

  const handleFileDeleteCLP = (type, index) => {
    setGlobalFilesCLP(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleFileUploadHEC = (type, files, isAppend = false) => {
    if (!files) return;
    const fileArray = files instanceof FileList ? Array.from(files) : (Array.isArray(files) ? files : [files]);
    setGlobalFilesHEC(prev => ({
      ...prev,
      [type]: isAppend ? [...prev[type], ...fileArray] : fileArray
    }));
  };

  const handleFileDeleteHEC = (type, index) => {
    setGlobalFilesHEC(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleUtilityChange = (newUtility) => {
    setUtility(newUtility);
    // HEC 仅支持更换，CLP 支持更换和新添置
    if (newUtility === 'HEC') {
      setInstallationType('replacement');
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && selectedIndustry) {
      // Initialize analysisData with empty items when moving to verification step
      setAnalysisData({
        utility,
        installationType,
        clpType, // Add this line
        items: [],
        step1OperatingHours: operatingHours,
        hasEnergyAudit: false,
        confidence: 1.0
      });
      setCurrentStep(2);
    } else if (currentStep === 2 && analysisData) {
      const savings = calculateBatchSavings(analysisData);
      const report = generateReportData(analysisData, savings, selectedIndustry, operatingHours);
      setReportData(report);
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDownloadExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    const items = reportData.items || [];
    const fmtDate = (d) => d || '';

    // 輔助函數：創建帶表頭的 Sheet
    const createSheetWithHeaders = (data, headers) => {
      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      // 如果沒有數據，手動設置表頭
      if (data.length === 0) {
        XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
      }
      return ws;
    };

    if (utility === 'HEC') {
      // === 港燈 (HEC) 申報邏輯 ===
      const headersHEC_Existing = ['Item No.', '設備', '型號及品牌', '空調: 製冷量 (千瓦)', '燈具: 直徑 (如T5/T8)', '燈具: 長度 (毫米)', '額定功率 (瓦)', '數量', '安裝位置', '每年使用時數'];
      const headersHEC_New = ['Item No.', '設備', '型號及品牌', '空調: 製冷量 (千瓦)', '燈具: 直徑 (如T5/T8)', '燈具: 長度 (毫米)', '額定功率 (瓦)', '數量', '安裝位置', '每年使用時數'];
      const headersHEC_Payment = ['Item No.', '設備', '付款日期 (DD/MM/YYYY)', '項目費用淨額 (港幣) (A)', '其他基金資助 (港幣) (B)', '合資格項目費用淨額 (港幣) (A)-(B)=(C)'];

      // 1. 更換節能設備（原有裝置）- 僅針對更換類項目 (Retrofit)
      const retrofits = items.filter(i => !i.isNewInstallation);
      const dataHEC_Existing = retrofits.map((item, idx) => ({
        'Item No.': idx + 1,
        '設備': item.deviceType.includes('AC') ? '空調' : (item.deviceType.includes('LED') ? '燈具' : '其他設備'),
        '型號及品牌': `${item.oldBrand || ''} ${item.oldModel || ''}` || '原有舊設備',
        '空調: 製冷量 (千瓦)': item.oldCoolingCapacity || '',
        '燈具: 直徑 (如T5/T8)': item.oldDiameter || '',
        '燈具: 長度 (毫米)': item.oldLength || '',
        '額定功率 (瓦)': item.oldRatedPower || 0,
        '數量': item.quantity,
        '安裝位置': item.oldInstallLocation || item.installLocation || '',
        '每年使用時數': item.oldOperatingHours || (operatingHours * 365)
      }));
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataHEC_Existing, headersHEC_Existing), "HEC Appendix A (Existing)");

      // 2. 更換節能設備（新裝裝置）- 所有新安裝或替換後的設備 (不包括純移除)
      const newInstalls = items.filter(i => !i.isRemovalOnly);
      const dataHEC_New = newInstalls.map((item, idx) => ({
        'Item No.': idx + 1,
        '設備': item.deviceType.includes('AC') ? '空調' : (item.deviceType.includes('LED') ? '燈具' : '其他設備'),
        '型號及品牌': `${item.brand || ''} ${item.model || ''}`,
        '空調: 製冷量 (千瓦)': item.coolingCapacity || '',
        '燈具: 直徑 (如T5/T8)': item.diameter || '',
        '燈具: 長度 (毫米)': item.length || '',
        '額定功率 (瓦)': item.ratedPower || 0,
        '數量': item.quantity,
        '安裝位置': item.installLocation || '',
        '每年使用時數': item.operatingHours || (operatingHours * 365)
      }));
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataHEC_New, headersHEC_New), "HEC Appendix A (New)");

      // 3. 付款資料
      const dataHEC_Payment = newInstalls.map((item, idx) => {
        const totalCost = item.equipmentCost || 0;
        const otherSubsidy = item.otherSubsidy || 0;
        return {
          'Item No.': idx + 1,
          '設備': item.deviceType.includes('AC') ? '空調' : (item.deviceType.includes('LED') ? '燈具' : '其他設備'),
          '付款日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
          '項目費用淨額 (港幣) (A)': totalCost,
          '其他基金資助 (港幣) (B)': otherSubsidy,
          '合資格項目費用淨額 (港幣) (A)-(B)=(C)': totalCost - otherSubsidy
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataHEC_Payment, headersHEC_Payment), "HEC Appendix A (Payment)");

      XLSX.writeFile(workbook, `GreenSwitch_HEC_Application_${new Date().getTime()}.xlsx`);
    } else {
      // === 中電 (CLP) 申報邏輯 ===
      // 分類數據
      const clp_A_Old_Only = items.filter(i => i.deviceType === 'AC_GRADE1' && !i.isNewInstallation);
      const clp_A_New_Only = items.filter(i => i.deviceType === 'AC_GRADE1' && !i.isRemovalOnly);
      
      const clp_B1_Old_Only = items.filter(i => i.deviceType === 'AC_SYSTEM' && !i.isNewInstallation);
      const clp_B1_New_Only = items.filter(i => i.deviceType === 'AC_SYSTEM' && !i.isRemovalOnly);
      
      const clp_C_Old_Only = items.filter(i => i.deviceType === 'LED_LIGHTING' && !i.isNewInstallation);
      const clp_C_New_Only = items.filter(i => i.deviceType === 'LED_LIGHTING' && !i.isRemovalOnly);
      
      const clp_D_Old_Only = items.filter(i => i.deviceType === 'OTHER_EQUIP' && !i.isNewInstallation);
      const clp_D_New_Only = items.filter(i => i.deviceType === 'OTHER_EQUIP' && !i.isRemovalOnly);

      const clp_B2_Unitary = items.filter(i => i.deviceType === 'AC_SYSTEM' && !i.isRemovalOnly && i.category === '單式組裝空調機');
      const clp_B2_VRF = items.filter(i => i.deviceType === 'AC_SYSTEM' && !i.isRemovalOnly && i.category === '可變冷凍劑流量系統');
      const clp_B2_Chiller = items.filter(i => i.deviceType === 'AC_SYSTEM' && !i.isRemovalOnly && i.category === '冷水機');

      // 1. (A) 舊有空調機
      const headersA_Old = ['項目編號', '品牌及型號', '匹數', '數量 (a)', '額定輸入功率 (千瓦) (b)', '每年使用時數 (c)', '每年平均負荷系數 (%) (d)', '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)', '安裝地點'];
      const dataA_Old = clp_A_Old_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '品牌及型號': `${item.oldBrand || ''} ${item.oldModel || ''}`,
          '匹數': item.oldCapacity || '',
          '數量 (a)': item.quantity,
          '額定輸入功率 (千瓦) (b)': item.oldRatedPower || 0,
          '每年使用時數 (c)': item.oldOperatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (d)': (item.oldLoadFactor || 70).toFixed(0),
          '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)': Math.round(item.oldAnnualUsage || 0),
          '安裝地點': item.oldInstallLocation || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataA_Old, headersA_Old), "(A) 舊有空調機");

      // 2. (A) 新安裝的一級能源標籤空調機
      const headersA_New = ['項目編號', '更換或新添置及安裝', '品牌及型號', '匹數', '預計安裝數量 (f)', '額定輸入功率 (千瓦) (g)', '每年使用時數 (h)', '每年平均負荷系數 (%) (i)', '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)', '#估計每年能源節省量 (度電/年) (k) = (e) - (j)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataA_New = clp_A_New_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '更換或新添置及安裝': item.isNewInstallation ? '新添置及安裝' : '更換',
          '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
          '匹數': item.capacity || '',
          '預計安裝數量 (f)': item.quantity,
          '額定輸入功率 (千瓦) (g)': item.ratedPower || 0,
          '每年使用時數 (h)': item.operatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (i)': (item.loadFactor || 70).toFixed(0),
          '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)': Math.round(item.newAnnualUsage || 0),
          '#估計每年能源節省量 (度電/年) (k) = (e) - (j)': Math.round(item.annualSavingsKWh || 0),
          '安裝地點': item.installLocation || '',
          '購買單價 (港幣)': item.equipmentCost,
          '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
          '^實際安裝數量': item.actualQuantity || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataA_New, headersA_New), "(A) 新安裝的一級能源標籤空調機");

      // 3. (B1) 舊有空調系統
      const headersB1_Old = ['項目編號', '品牌及型號', '空調系統類別', '氣冷式或水冷式', '設備種類', '製冷量 (千瓦)', '數量 (a)', '額定輸入功率 (千瓦) (b)', '每年使用時數 (c)', '每年平均負荷系數 (%) (d)', '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)', '安裝地點'];
      const dataB1_Old = clp_B1_Old_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '品牌及型號': `${item.oldBrand || ''} ${item.oldModel || ''}`,
          '空調系統類別': item.oldCategory || '單式組裝空調機',
          '氣冷式或水冷式': item.oldAirOrWaterCooled || '氣冷式',
          '設備種類': item.oldEquipmentType || '分體式',
          '製冷量 (千瓦)': item.oldCoolingCapacity || 0,
          '數量 (a)': item.quantity,
          '額定輸入功率 (千瓦) (b)': item.oldRatedPower || 0,
          '每年使用時數 (c)': item.oldOperatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (d)': (item.oldLoadFactor || 70).toFixed(0),
          '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)': Math.round(item.oldAnnualUsage || 0),
          '安裝地點': item.oldInstallLocation || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataB1_Old, headersB1_Old), "(B1) 舊有空調系統");

      // 4. (B1) 新安裝的空調系統
      const headersB1_New = ['項目編號', '品牌及型號', '空調系統類別', '氣冷式或水冷式', '設備種類', '製冷量 (千瓦)', '預計安裝數量 (f)', '額定輸入功率 (千瓦) (g)', '每年使用時數 (h)', '每年平均負荷系數 (%) (i)', '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)', '估計每年能源節省量 (度電/年) (k) = (e) - (j)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataB1_New = clp_B1_New_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
          '空調系統類別': item.category || '單式組裝空調機',
          '氣冷式或水冷式': item.airOrWaterCooled || '氣冷式',
          '設備種類': item.equipmentType || '分體式',
          '製冷量 (千瓦)': item.coolingCapacity || 0,
          '預計安裝數量 (f)': item.quantity,
          '額定輸入功率 (千瓦) (g)': item.ratedPower || 0,
          '每年使用時數 (h)': item.operatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (i)': (item.loadFactor || 70).toFixed(0),
          '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)': Math.round(item.newAnnualUsage || 0),
          '估計每年能源節省量 (度電/年) (k) = (e) - (j)': Math.round(item.annualSavingsKWh || 0),
          '安裝地點': item.installLocation || '',
          '購買單價 (港幣)': item.equipmentCost,
          '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
          '^實際安裝數量': item.actualQuantity || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataB1_New, headersB1_New), "(B1) 新安裝的空調系統");

      // 5. (B2) 單式組裝空調機
      const headersB2_Unitary = ['項目編號', '品牌及型號', '氣冷式或水冷式', '設備種類 (例如: 分體式/非分體式)', '製冷量 (千瓦)', '預計安裝數量', '額定輸入功率 (千瓦)', '每年使用時數', '每年平均負荷系數 (%)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataB2_Unitary = clp_B2_Unitary.map((item, idx) => ({
        '項目編號': idx + 1,
        '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
        '氣冷式或水冷式': item.airOrWaterCooled || '氣冷式',
        '設備種類 (例如: 分體式/非分體式)': item.equipmentType || '分體式',
        '製冷量 (千瓦)': item.coolingCapacity || 0,
        '預計安裝數量': item.quantity,
        '額定輸入功率 (千瓦)': item.ratedPower || 0,
        '每年使用時數': item.operatingHours || (operatingHours * 365),
        '每年平均負荷系數 (%)': (item.loadFactor || 70).toFixed(0),
        '安裝地點': item.installLocation || '',
        '購買單價 (港幣)': item.equipmentCost,
        '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
        '^實際安裝數量': item.actualQuantity || ''
      }));
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataB2_Unitary, headersB2_Unitary), "(B2) 單式組裝空調機");

      // 6. (B2) VRF系統
      const headersB2_VRF = ['項目編號', '品牌及型號', '氣冷式或水冷式', '製冷量 (千瓦)', '預計安裝數量', '額定輸入功率 (千瓦)', '每年使用時數', '每年平均負荷系數 (%)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataB2_VRF = clp_B2_VRF.map((item, idx) => ({
        '項目編號': idx + 1,
        '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
        '氣冷式或水冷式': item.airOrWaterCooled || '氣冷式',
        '製冷量 (千瓦)': item.coolingCapacity || 0,
        '預計安裝數量': item.quantity,
        '額定輸入功率 (千瓦)': item.ratedPower || 0,
        '每年使用時數': item.operatingHours || (operatingHours * 365),
        '每年平均負荷系數 (%)': (item.loadFactor || 70).toFixed(0),
        '安裝地點': item.installLocation || '',
        '購買單價 (港幣)': item.equipmentCost,
        '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
        '^實際安裝數量': item.actualQuantity || ''
      }));
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataB2_VRF, headersB2_VRF), "(B2) VRF系統");

      // 7. (B2) 冷水機
      const headersB2_Chiller = ['項目編號', '品牌及型號', '氣冷式或水冷式', '壓縮機種類 (例如: 往復式/渦旋式/螺桿式/可變速驅動器螺桿式/離心式/可變速驅動器離心式)', '製冷量 (千瓦)', '預計安裝數量', '額定輸入功率 (千瓦)', '每年使用時數', '每年平均負荷系數 (%)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataB2_Chiller = clp_B2_Chiller.map((item, idx) => ({
        '項目編號': idx + 1,
        '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
        '氣冷式或水冷式': item.airOrWaterCooled || '氣冷式',
        '壓縮機種類 (例如: 往復式/渦旋式/螺桿式/可變速驅動器螺桿式/離心式/可變速驅動器離心式)': item.compressorType || '',
        '製冷量 (千瓦)': item.coolingCapacity || 0,
        '預計安裝數量': item.quantity,
        '額定輸入功率 (千瓦)': item.ratedPower || 0,
        '每年使用時數': item.operatingHours || (operatingHours * 365),
        '每年平均負荷系數 (%)': (item.loadFactor || 70).toFixed(0),
        '安裝地點': item.installLocation || '',
        '購買單價 (港幣)': item.equipmentCost,
        '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
        '^實際安裝數量': item.actualQuantity || ''
      }));
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataB2_Chiller, headersB2_Chiller), "(B2) 冷水機");

      // 8. (C) 舊有非LED燈膽光管
      const headersC_Old = ['項目編號', '設備種類', '長度 (英呎)', '直徑 (如T5,T8)', '數量 (a)', '額定輸入功率 (瓦) (b)', '每年使用時數 (c)', '估計每年能源消耗量 (度電/年) (d) = (a) x (b) / 1000 x (c)', '安裝地點'];
      const dataC_Old = clp_C_Old_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '設備種類': item.oldSubType || '光管',
          '長度 (英呎)': item.oldLength || '',
          '直徑 (如T5,T8)': item.oldDiameter || '',
          '數量 (a)': item.quantity,
          '額定輸入功率 (瓦) (b)': item.oldRatedPower || 0,
          '每年使用時數 (c)': item.oldOperatingHours || (operatingHours * 365),
          '估計每年能源消耗量 (度電/年) (d) = (a) x (b) / 1000 x (c)': Math.round(item.oldAnnualUsage || 0),
          '安裝地點': item.oldInstallLocation || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataC_Old, headersC_Old), "(C) 舊有非LED燈膽光管");

      // 9. (C) 新安裝的LED燈膽光管
      const headersC_New = ['項目編號', '設備種類', '更換或新添置及安裝', '品牌及型號', '長度 (英呎)', '直徑 (如T5,T8)', '預計安裝數量 (e)', '額定輸入功率 (瓦) (f)', '每年使用時數 (g)', '估計每年能源消耗量 (度電/年) (h) = (e) x (f) / 1000 x (g)', '#估計每年能源節省量 (度電/年) (i) = (d) - (h)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataC_New = clp_C_New_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '設備種類': item.subType || 'LED 燈膽',
          '更換或新添置及安裝': item.isNewInstallation ? '新添置及安裝' : '更換',
          '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
          '長度 (英呎)': (item.subType === 'LED 光管' || item.subType === 'LED 燈帶') ? (item.length || '') : '',
          '直徑 (如T5,T8)': item.subType === 'LED 光管' ? (item.diameter || '') : '',
          '預計安裝數量 (e)': item.quantity,
          '額定輸入功率 (瓦) (f)': item.ratedPower || 0,
          '每年使用時數 (g)': item.operatingHours || (operatingHours * 365),
          '估計每年能源消耗量 (度電/年) (h) = (e) x (f) / 1000 x (g)': Math.round(item.newAnnualUsage || 0),
          '#估計每年能源節省量 (度電/年) (i) = (d) - (h)': Math.round(item.annualSavingsKWh || 0),
          '安裝地點': item.installLocation || '',
          '購買單價 (港幣)': item.equipmentCost,
          '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
          '^實際安裝數量': item.actualQuantity || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataC_New, headersC_New), "(C) 新安裝的LED燈膽光管");

      // 10. (D) 舊有設備
      const headersD_Old = ['項目編號', '品牌及型號', '設備類型', '輸出 (千瓦)', '額定輸入功率 (千瓦) (a)', '每年使用時數 (b)', '每年平均負荷系數 (%) (c)', '數量 (d)', '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)', '安裝地點'];
      const dataD_Old = clp_D_Old_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '品牌及型號': `${item.oldBrand || ''} ${item.oldModel || ''}`,
          '設備類型': item.oldDeviceType || '其他',
          '輸出 (千瓦)': item.oldOutput || 0,
          '額定輸入功率 (千瓦) (a)': item.oldRatedPower || 0,
          '每年使用時數 (b)': item.oldOperatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (c)': (item.oldLoadFactor || 70).toFixed(0),
          '數量 (d)': item.quantity,
          '估計每年能源消耗量 (度電/年) (e) = (a) x (b) x (c) x (d)': Math.round(item.oldAnnualUsage || 0),
          '安裝地點': item.oldInstallLocation || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataD_Old, headersD_Old), "(D) 舊有設備");

      // 11. (D) 新安裝設備
      const headersD_New = ['項目編號', '更換或新添置及安裝', '品牌及型號', '設備類型', '輸出 (千瓦)', '額定輸入功率 (千瓦) (f)', '每年使用時數 (g)', '每年平均負荷系數 (%) (h)', '數量 (i)', '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)', '#估計每年能源節省量 (度電/年) (k) = (e) - (j)', '安裝地點', '購買單價 (港幣)', '購買日期 (DD/MM/YYYY)', '^實際安裝數量'];
      const dataD_New = clp_D_New_Only.map((item, idx) => {
        return {
          '項目編號': idx + 1,
          '更換或新添置及安裝': item.isNewInstallation ? '新添置及安裝' : '更換',
          '品牌及型號': `${item.brand || ''} ${item.model || ''}`,
          '設備類型': item.deviceType || '其他',
          '輸出 (千瓦)': item.output || 0,
          '額定輸入功率 (千瓦) (f)': item.ratedPower || 0,
          '每年使用時數 (g)': item.operatingHours || (operatingHours * 365),
          '每年平均負荷系數 (%) (h)': (item.loadFactor || 70).toFixed(0),
          '數量 (i)': item.quantity,
          '估計每年能源消耗量 (度電/年) (j) = (f) x (g) x (h) x (i)': Math.round(item.newAnnualUsage || 0),
          '#估計每年能源節省量 (度電/年) (k) = (e) - (j)': Math.round(item.annualSavingsKWh || 0),
          '安裝地點': item.installLocation || '',
          '購買單價 (港幣)': item.equipmentCost,
          '購買日期 (DD/MM/YYYY)': fmtDate(item.purchaseDate),
          '^實際安裝數量': item.actualQuantity || ''
        };
      });
      XLSX.utils.book_append_sheet(workbook, createSheetWithHeaders(dataD_New, headersD_New), "(D) 新安裝設備");

      // 導出文件
      XLSX.writeFile(workbook, `GreenSwitch_CLP_Application_中文_${new Date().getTime()}.xlsx`);
    }
  };

  const handleDataConfirm = () => {
    handleNextStep();
  };

  const canProceedFromStep1 = selectedIndustry;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">GreenSwitch HK</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">AI-Powered Energy Efficient Equipment Subsidy Assistant</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <OfficialWebsiteDropdown />
            <SubsidyGuideDropdown />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <WizardStepper currentStep={currentStep} steps={steps} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center max-w-3xl mx-auto pt-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 mb-6"
                >
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">2026 節能設備資助申報助手</span>
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                  AI 驅動，讓您的節能設備資助申報<br />
                  <span className="text-emerald-600">更簡單、更精準</span>
                </h2>
              </div>

              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 gap-10">
                  <div className="space-y-6">
                    <label className="block text-sm font-bold text-slate-900 uppercase tracking-widest">01. 選擇您的電力公司</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleUtilityChange('CLP')}
                        className={`p-6 rounded-2xl border-2 transition-all flex items-center space-x-4 ${
                          utility === 'CLP' ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${utility === 'CLP' ? 'bg-amber-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                          <span className="font-bold text-sm">CLP</span>
                        </div>
                        <div className="text-left">
                          <span className={`block font-bold ${utility === 'CLP' ? 'text-amber-900' : 'text-slate-700'}`}>中華電力 (中電)</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleUtilityChange('HEC')}
                        className={`p-6 rounded-2xl border-2 transition-all flex items-center space-x-4 ${
                          utility === 'HEC' ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-600/10' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${utility === 'HEC' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                          <span className="font-bold text-sm">HEC</span>
                        </div>
                        <div className="text-left">
                          <span className={`block font-bold ${utility === 'HEC' ? 'text-emerald-900' : 'text-slate-700'}`}>香港電燈 (港燈)</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <label className="block text-sm font-bold text-slate-900 uppercase tracking-widest">02. 行業與運作模式</label>
                    <IndustrySelector
                      selectedIndustry={selectedIndustry}
                      onIndustryChange={setSelectedIndustry}
                      operatingHours={operatingHours}
                      onHoursChange={setOperatingHours}
                      utility={utility}
                      clpType={clpType}
                      onClpTypeChange={setClpType}
                    />
                  </div>
                </div>

                <div className="mt-12 flex flex-col items-center space-y-4">
                  <button
                    onClick={handleNextStep}
                    disabled={!canProceedFromStep1}
                    className={`w-full sm:w-auto px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                      canProceedFromStep1
                        ? 'bg-[#059669] text-white hover:bg-[#047857] shadow-xl shadow-emerald-600/20'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>下一步：上傳資料</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 特色介紹 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                {[
                  { icon: Zap, title: 'AI 自動識別', desc: '自動從電費單和標籤中提取功率、電價等核心參數。' },
                  { icon: ShieldCheck, title: '合規申報', desc: '嚴格遵循 CLP/HEC 最新資助指南，確保預估準確。' },
                  { icon: TrendingUp, title: '批量管理', desc: '支持多設備組合申報，最大化您的資助收益。' },
                ].map((feature, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-6">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                      <feature.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{feature.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 2 && analysisData && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>返回選擇電力公司和行業類型</span>
                </button>
                <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">Step 02 / 03</div>
              </div>
              
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                {utility === 'CLP' ? (
                  <DataVerificationCLP
                    data={analysisData}
                    onDataChange={setAnalysisData}
                    onConfirm={handleDataConfirm}
                    globalFiles={globalFilesCLP}
                    onGlobalFileUpload={handleFileUploadCLP}
                    onGlobalFileDelete={handleFileDeleteCLP}
                  />
                ) : (
                  <DataVerificationHEC
                    data={analysisData}
                    onDataChange={setAnalysisData}
                    onConfirm={handleDataConfirm}
                    globalFiles={globalFilesHEC}
                    onGlobalFileUpload={handleFileUploadHEC}
                    onGlobalFileDelete={handleFileDeleteHEC}
                  />
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && reportData && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>返回資料上傳與數據確認</span>
                </button>
              </div>

              {utility === 'CLP' ? (
                <Step4CLP
                  reportData={reportData}
                  onExportXLSX={(lang) => handleDownloadExcel(lang)}
                  electricityPriceIncrease={electricityPriceIncrease}
                  onPriceIncreaseChange={setElectricityPriceIncrease}
                  operatingHours={operatingHours}
                  onHoursChange={setOperatingHours}
                  clpType={clpType}
                />
              ) : (
                <Step4HEC
                  reportData={reportData}
                  onExportXLSX={handleDownloadExcel}
                  electricityPriceIncrease={electricityPriceIncrease}
                  onPriceIncreaseChange={setElectricityPriceIncrease}
                  operatingHours={operatingHours}
                  onHoursChange={setOperatingHours}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
