// 模拟AI分析函数
export const mockAnalyzeImages = async (electricityBillFiles, efficiencyLabelFiles, oldEfficiencyLabelFiles, utility, installationType) => {
  // 模拟2秒的处理时间
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 返回模拟的分析结果
  return {
    oldPower: 4.5, // 旧设备功率 (kW)
    newPower: 2.2, // 新设备功率 (kW)
    monthlyUsage: 2500, // 月均用电量 (kWh)
    electricityPrice: 1.2, // 电价 (HKD/kWh)
    efficiencyRating: 1, // 能效等级 (1-5)
    confidence: 0.95, // AI识别置信度
    hasEnergyAudit: false, // 是否完成能源审核
    // 根据 utility 和 installationType 调整财务数据
    equipmentCost: utility === 'CLP' ? 12000 : 25000, // CLP 单价较低，HEC 工程总价较高
    laborCost: utility === 'HEC' ? 5000 : 0, // HEC 包含人工费
    quantity: 1, // 設備數量
    utility: utility, // 傳入的電力公司
    installationType: installationType, // 傳入的安裝類型
    deviceType: 'AC_GRADE1', // 設備類型
    purchaseDate: new Date().toISOString().split('T')[0], // 預設購買日期
    // 新增中電專屬字段
    loadFactor: 70, // 默認負載因子 70%
    is24Hours: false,
    installLocation: 'Office Area',
    brand: 'Daikin',
    model: 'FTXM35XV1N',
  };
};

// 计算节能效益
export const calculateEnergySavings = (item) => {
  const isNew = item.isNewInstallation;
  const isRemoval = item.isRemovalOnly;
  const hours = item.operatingHours || 2500;
  const loadFactor = (item.loadFactor || 70) / 100;
  const oldHours = item.oldOperatingHours || 2500;
  const oldLoadFactor = (item.oldLoadFactor || 70) / 100;
  const electricityPrice = item.electricityPrice || 1.2;

  let oldConsumption = 0;
  let newConsumption = 0;

  // In atomic design, item.quantity is the merged count of 1:1 pairs
  const isHEC = item.utility === 'HEC';
  
  if (item.deviceType === 'LED_LIGHTING' || item.deviceType === 'LED_BULB' || item.deviceType === 'LED_TUBE') {
    if (!isRemoval) {
      newConsumption = (item.quantity * (item.ratedPower || 0) / 1000) * hours;
    }
    if (!isNew) {
      oldConsumption = (item.quantity * (item.oldRatedPower || 0) / 1000) * oldHours;
    }
  } else {
    // For AC and others: HEC uses Watts, CLP uses kW
    const powerFactor = isHEC ? 1000 : 1;
    if (!isRemoval) {
      newConsumption = (item.quantity * (item.ratedPower || 0) / powerFactor) * hours * loadFactor;
    }
    if (!isNew) {
      oldConsumption = (item.quantity * (item.oldRatedPower || 0) / powerFactor) * oldHours * oldLoadFactor;
    }
  }

  const annualSavingsKWh = Math.max(0, oldConsumption - newConsumption);
  const annualSavings = annualSavingsKWh * electricityPrice;
  
  // 年減碳量 (噸 CO2e)
  const carbonFactor = item.utility === 'HEC' ? 0.71 : 0.37;
  const carbonReduction = (annualSavingsKWh * carbonFactor) / 1000;
  
  // 獲獲批資助額預估 (HKD)
  let estimatedSubsidy = 0;
  
  const totalCost = item.utility === 'HEC' ? item.equipmentCost : (item.equipmentCost * item.quantity);
  const netCost = Math.max(0, totalCost - (item.otherSubsidy || 0));

  if (item.utility === 'HEC') {
    // 港燈 (HEC) 邏輯：基於成本和上限
    const baseRate = item.hasEnergyAudit ? 0.8 : 0.6;
    const rawSubsidy = netCost * baseRate;
    
    let capPerItem = Infinity;
    if (item.deviceType === 'AC_GRADE1') {
      capPerItem = 2500;
    } else if (item.deviceType === 'AC_SYSTEM' || item.deviceType === 'HEAT_RECOVERY') {
      capPerItem = 10000;
    } else if (item.deviceType === 'LED_BULB') {
      capPerItem = 20;
    } else if (item.deviceType === 'LED_TUBE') {
      capPerItem = 60;
    } else if (item.deviceType === 'LED') {
      // 兼容舊數據
      const isTubeOrStrip = item.subType?.includes('光管') || item.subType?.includes('燈帶') || item.subType?.includes('燈盤') || 
                            item.oldSubType?.includes('光管') || item.oldSubType?.includes('燈帶') || item.oldSubType?.includes('燈盤');
      capPerItem = isTubeOrStrip ? 60 : 20;
    }
    
    estimatedSubsidy = Math.min(rawSubsidy, capPerItem * item.quantity);
  } else {
    // 中電 (CLP) 邏輯：基於節能量 (原有邏輯)
    let ratePerKWh = 0.5;
    if (item.deviceType === 'AC_GRADE1' || item.deviceType === 'AC_SYSTEM') {
      ratePerKWh = 5.0;
    } else if (item.deviceType === 'LED_LIGHTING' || item.deviceType === 'LED' || item.deviceType === 'LED_BULB' || item.deviceType === 'LED_TUBE') {
      ratePerKWh = 1.0;
    }
    estimatedSubsidy = annualSavingsKWh * ratePerKWh;
    estimatedSubsidy = Math.min(estimatedSubsidy, totalCost);
  }
  
  const subsidyRate = totalCost > 0 ? estimatedSubsidy / totalCost : 0;
  const netInvestment = totalCost - estimatedSubsidy;
  const paybackPeriod = annualSavings > 0 ? (netInvestment / annualSavings) * 12 : 0;
  
  return {
    ...item, // Keep all original fields
    oldAnnualUsage: oldConsumption,
    newAnnualUsage: newConsumption,
    annualSavingsKWh,
    annualSavings,
    carbonReduction,
    equipmentCost: totalCost,
    estimatedSubsidy,
    subsidyRate,
    netInvestment,
    paybackPeriod,
    utility: item.utility,
    deviceType: item.deviceType,
    purchaseDate: item.purchaseDate
  };
};

// 計算批量節能效益
export const calculateBatchSavings = (data) => {
  const { items = [], utility, electricityPrice, hasEnergyAudit } = data;
  
  if (items.length === 0) return null;

  // 對每個項目單獨計算
  const itemResults = items.map(item => calculateEnergySavings({
    ...item,
    utility,
    electricityPrice,
    hasEnergyAudit
  }));

  // 匯總數據
  const totalOldAnnualUsage = itemResults.reduce((sum, r) => sum + (r.oldAnnualUsage || 0), 0);
  const totalNewAnnualUsage = itemResults.reduce((sum, r) => sum + (r.newAnnualUsage || 0), 0);
  const totalAnnualSavingsKWh = itemResults.reduce((sum, r) => sum + (r.annualSavingsKWh || 0), 0);
  const totalAnnualSavings = itemResults.reduce((sum, r) => sum + (r.annualSavings || 0), 0);
  const totalCarbonReduction = itemResults.reduce((sum, r) => sum + (r.carbonReduction || 0), 0);
  const totalEquipmentCost = itemResults.reduce((sum, r) => sum + (r.equipmentCost || 0), 0);

  // 獲批資助額預估 (考慮總額上限)
  let totalEstimatedSubsidy = itemResults.reduce((sum, r) => sum + (r.estimatedSubsidy || 0), 0);
  
  if (utility === 'CLP') {
    // 中電上限：非住宅 $10,000，大量用電 $200,000
    const clpCap = data.clpType === 'largeHighDemand' ? 200000 : 10000;
    totalEstimatedSubsidy = Math.min(totalEstimatedSubsidy, clpCap);
  } else if (utility === 'HEC') {
    // 港燈上限：每個處所 $150,000 (根據最新指南)
    totalEstimatedSubsidy = Math.min(totalEstimatedSubsidy, 150000);
  }

  const subsidyRate = totalEquipmentCost > 0 ? totalEstimatedSubsidy / totalEquipmentCost : 0;
  const netInvestment = totalEquipmentCost - totalEstimatedSubsidy;
  const paybackPeriod = totalAnnualSavings > 0 ? (netInvestment / totalAnnualSavings) * 12 : 0;

  return {
    oldAnnualUsage: totalOldAnnualUsage,
    newAnnualUsage: totalNewAnnualUsage,
    annualSavingsKWh: totalAnnualSavingsKWh,
    annualSavings: totalAnnualSavings,
    carbonReduction: totalCarbonReduction,
    equipmentCost: totalEquipmentCost,
    estimatedSubsidy: totalEstimatedSubsidy,
    subsidyRate,
    netInvestment,
    paybackPeriod,
    utility,
    itemCount: items.length,
    items: itemResults
  };
};

// 生成報告數據
export const generateReportData = (analysisData, savingsData, industry, operatingHours) => {
  return {
    ...analysisData,
    ...savingsData,
    industry,
    operatingHours,
    date: new Date().toLocaleDateString('zh-HK'),
  };
};
