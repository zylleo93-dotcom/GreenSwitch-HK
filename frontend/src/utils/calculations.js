import { aiApi } from './api.js';

/**
 * 将 File 对象转为 base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        data: base64,
        mimeType: file.type
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 分析图片 (使用后端 API)
 * @param {Object} files - 文件对象
 * @param {string} utility - 电力公司
 * @param {string} installationType - 安装类型
 */
export const analyzeImages = async (files, utility, installationType) => {
  try {
    // 转换所有文件为 base64
    const [electricityBillImages, efficiencyLabelImages, oldEfficiencyLabelImages, financialImages] = await Promise.all([
      Promise.all((files.electricity || []).map(fileToBase64)),
      Promise.all((files.efficiency || []).map(fileToBase64)),
      Promise.all((files.oldEfficiency || []).map(fileToBase64)),
      Promise.all((files.financial || []).map(fileToBase64))
    ]);

    // 调用后端 API
    const response = await aiApi.analyze({
      electricityBillImages,
      efficiencyLabelImages,
      oldEfficiencyLabelImages,
      financialImages,
      utility,
      installationType
    });

    return response.data;
  } catch (error) {
    console.error('AI Analysis error:', error);
    throw error;
  }
};

/**
 * 计算节能效益 (使用后端 API)
 */
export const calculateBatchSavings = async (data) => {
  try {
    const { items = [], utility, electricityPrice, hasEnergyAudit, clpType } = data;
    
    if (items.length === 0) return null;

    const response = await aiApi.calculate({
      items,
      utility,
      electricityPrice,
      hasEnergyAudit,
      clpType
    });

    return {
      ...response.data.summary,
      items: response.data.items
    };
  } catch (error) {
    console.error('Calculation error:', error);
    throw error;
  }
};

/**
 * 生成报告数据
 */
export const generateReportData = (analysisData, savingsData, industry, operatingHours) => {
  return {
    ...analysisData,
    ...savingsData,
    industry,
    operatingHours,
    date: new Date().toLocaleDateString('zh-HK')
  };
};
