import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../index.js';
import crypto from 'crypto';

const router = Router();

// 初始化 Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

/**
 * 计算文件哈希
 */
const calculateHash = (files) => {
  const hash = crypto.createHash('md5');
  files.forEach(file => {
    hash.update(file.buffer);
  });
  return hash.digest('hex');
};

/**
 * 从缓存获取结果
 */
const getCachedResult = async (hash) => {
  try {
    const doc = await db.collection('ai_cache').doc(hash).get();
    if (doc.exists) {
      return doc.data().result;
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
};

/**
 * 保存结果到缓存
 */
const setCachedResult = async (hash, result) => {
  try {
    await db.collection('ai_cache').doc(hash).set({
      result,
      createdAt: new Date()
    });
  } catch (e) {
    console.error('Cache write error:', e);
  }
};

/**
 * AI 分析图片
 * POST /api/ai/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { 
      electricityBillImages, 
      efficiencyLabelImages, 
      oldEfficiencyLabelImages,
      financialImages,
      utility, 
      installationType 
    } = req.body;

    // 验证必需参数
    if (!utility || !['CLP', 'HEC'].includes(utility)) {
      return res.status(400).json({ error: '无效的电力公司参数' });
    }

    // 合并所有图片
    const allImages = [
      ...(electricityBillImages || []),
      ...(efficiencyLabelImages || []),
      ...(oldEfficiencyLabelImages || []),
      ...(financialImages || [])
    ];

    if (allImages.length === 0) {
      return res.status(400).json({ error: '请至少上传一张图片' });
    }

    // 计算缓存哈希
    const combinedHash = calculateHash(allImages.map(img => 
      Buffer.from(img.data, 'base64')
    ));

    // 检查缓存
    const cached = await getCachedResult(combinedHash);
    if (cached) {
      return res.json({ 
        success: true, 
        data: cached, 
        cached: true,
        hash: combinedHash 
      });
    }

    // 构建 AI 提示词
    const utilitySpecificInstructions = utility === 'CLP' 
      ? `【中電 (CLP) 專屬要求】：
         - 功率單位：請將所有功率識別並換算為 **千瓦 (kW)**。
         - 費用提取：請提取發票上的 **設備購買單價 (Unit Price)**。
         - 額外欄位：請識別設備的「輸出 (Output, kW)」。`
      : `【港燈 (HEC) 專屬要求】：
         - 功率單位：請保留 **瓦 (W)** 為單位，切勿換算為 kW。
         - 費用提取：請提取發票上的 **項目費用總額 (Total Amount)**，需包含設備費與安裝費。
         - 額外欄位：無須識別輸出功率。`;

    const prompt = `你是一個專業的能源審計助手。請分析以下資料（電費單、能效標籤、發票）：

    ${utilitySpecificInstructions}

    【通用識別要求】：
    1. 識別舊設備 (Old Device)：品牌 (oldBrand)、型號 (oldModel)、額定功率 (oldRatedPower)、匹數/HP (oldCapacity)、製冷量 (oldCoolingCapacity)。
    2. 識別新設備 (New Device)：品牌 (brand)、型號 (model)、額定功率 (ratedPower)、匹數/HP (capacity)、製冷量 (coolingCapacity)。
    3. 提取月均用電量 (monthlyUsage, kWh) 和電價 (electricityPrice, HKD/kWh)。
    4. 識別購買日期 (purchaseDate, 格式 YYYY-MM-DD)。
    5. 針對燈具 (Lighting)：請識別直徑 (diameter, 如 T5/T8) 和長度 (length, 毫米/mm)。
    6. 識別設備數量 (quantity)。

    【輸出規範】：
    - 請返回一個 JSON 數組，每個對象代表一個識別出的設備項目。
    - 如果某個欄位無法從資料中識別，請返回 null，不要猜測。
    - JSON 格式如下：
    [
      {
        "oldBrand": "string | null",
        "oldModel": "string | null",
        "oldRatedPower": number | null,
        "oldCapacity": "string | null", 
        "oldCoolingCapacity": number | null,
        "brand": "string | null",
        "model": "string | null",
        "ratedPower": number | null,
        "capacity": "string | null",
        "coolingCapacity": number | null,
        "output": number | null,
        "diameter": "string | null",
        "length": "string | null",
        "monthlyUsage": number | null,
        "electricityPrice": number | null,
        "equipmentCost": number | null,
        "purchaseDate": "string | null",
        "deviceType": "AC_GRADE1" | "AC_SYSTEM" | "LED_LIGHTING" | "OTHER_EQUIP",
        "quantity": number | null
      }
    ]`;

    // 转换图片为 Gemini 格式
    const imageParts = allImages.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || 'image/jpeg'
      }
    }));

    // 调用 Gemini AI
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const response = await ai.models.generateContent({
      model,
      contents: [{ 
        role: 'user',
        parts: [{ text: prompt }, ...imageParts] 
      }],
      config: { 
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    // 解析结果
    let aiResult;
    try {
      aiResult = JSON.parse(response.text);
    } catch (e) {
      // 如果返回的不是纯 JSON，尝试提取 JSON 部分
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回格式错误');
      }
    }

    // 确保返回数组
    const items = Array.isArray(aiResult) ? aiResult : [aiResult];

    // 标准化结果
    const finalResult = items.map(item => ({
      ...item,
      utility,
      installationType: installationType || 'replacement',
      purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      oldRatedPower: item.oldRatedPower || 0,
      ratedPower: item.ratedPower || 0,
      equipmentCost: item.equipmentCost || 0,
      quantity: item.quantity || 1,
      coolingCapacity: item.coolingCapacity || 0,
      oldCoolingCapacity: item.oldCoolingCapacity || 0,
      output: item.output || 0,
      monthlyUsage: item.monthlyUsage || 0,
      electricityPrice: item.electricityPrice || 1.2
    }));

    // 保存到缓存
    await setCachedResult(combinedHash, finalResult);

    res.json({
      success: true,
      data: finalResult,
      cached: false,
      hash: combinedHash,
      model
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({
      error: 'AI 分析失败',
      message: error.message
    });
  }
});

/**
 * 计算节能效益
 * POST /api/ai/calculate
 */
router.post('/calculate', async (req, res) => {
  try {
    const { items, utility, electricityPrice, hasEnergyAudit } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '无效的设备数据' });
    }

    // 计算每个项目的节能效益
    const itemResults = items.map(item => {
      const isNew = item.isNewInstallation;
      const isRemoval = item.isRemovalOnly;
      const hours = item.operatingHours || 2500;
      const loadFactor = (item.loadFactor || 70) / 100;
      const oldHours = item.oldOperatingHours || 2500;
      const oldLoadFactor = (item.oldLoadFactor || 70) / 100;
      const price = electricityPrice || item.electricityPrice || 1.2;

      let oldConsumption = 0;
      let newConsumption = 0;

      const isHEC = utility === 'HEC';
      
      if (item.deviceType === 'LED_LIGHTING' || item.deviceType === 'LED_BULB' || item.deviceType === 'LED_TUBE') {
        if (!isRemoval) {
          newConsumption = (item.quantity * (item.ratedPower || 0) / 1000) * hours;
        }
        if (!isNew) {
          oldConsumption = (item.quantity * (item.oldRatedPower || 0) / 1000) * oldHours;
        }
      } else {
        const powerFactor = isHEC ? 1000 : 1;
        if (!isRemoval) {
          newConsumption = (item.quantity * (item.ratedPower || 0) / powerFactor) * hours * loadFactor;
        }
        if (!isNew) {
          oldConsumption = (item.quantity * (item.oldRatedPower || 0) / powerFactor) * oldHours * oldLoadFactor;
        }
      }

      const annualSavingsKWh = Math.max(0, oldConsumption - newConsumption);
      const annualSavings = annualSavingsKWh * price;
      
      // 碳减排 (吨 CO2e)
      const carbonFactor = utility === 'HEC' ? 0.71 : 0.37;
      const carbonReduction = (annualSavingsKWh * carbonFactor) / 1000;
      
      // 预估资助额
      let estimatedSubsidy = 0;
      const totalCost = utility === 'HEC' 
        ? item.equipmentCost 
        : (item.equipmentCost * item.quantity);
      const netCost = Math.max(0, totalCost - (item.otherSubsidy || 0));

      if (utility === 'HEC') {
        const baseRate = hasEnergyAudit ? 0.8 : 0.6;
        const rawSubsidy = netCost * baseRate;
        
        let capPerItem = Infinity;
        if (item.deviceType === 'AC_GRADE1') capPerItem = 2500;
        else if (item.deviceType === 'AC_SYSTEM') capPerItem = 10000;
        else if (item.deviceType === 'LED_BULB') capPerItem = 20;
        else if (item.deviceType === 'LED_TUBE') capPerItem = 60;
        
        estimatedSubsidy = Math.min(rawSubsidy, capPerItem * item.quantity);
      } else {
        let ratePerKWh = 0.5;
        if (item.deviceType === 'AC_GRADE1' || item.deviceType === 'AC_SYSTEM') {
          ratePerKWh = 5.0;
        } else if (item.deviceType === 'LED_LIGHTING' || item.deviceType === 'LED') {
          ratePerKWh = 1.0;
        }
        estimatedSubsidy = annualSavingsKWh * ratePerKWh;
        estimatedSubsidy = Math.min(estimatedSubsidy, totalCost);
      }

      const subsidyRate = totalCost > 0 ? estimatedSubsidy / totalCost : 0;
      const netInvestment = totalCost - estimatedSubsidy;
      const paybackPeriod = annualSavings > 0 ? (netInvestment / annualSavings) * 12 : 0;

      return {
        ...item,
        oldAnnualUsage: oldConsumption,
        newAnnualUsage: newConsumption,
        annualSavingsKWh,
        annualSavings,
        carbonReduction,
        equipmentCost: totalCost,
        estimatedSubsidy,
        subsidyRate,
        netInvestment,
        paybackPeriod
      };
    });

    // 汇总数据
    const totalOldAnnualUsage = itemResults.reduce((sum, r) => sum + (r.oldAnnualUsage || 0), 0);
    const totalNewAnnualUsage = itemResults.reduce((sum, r) => sum + (r.newAnnualUsage || 0), 0);
    const totalAnnualSavingsKWh = itemResults.reduce((sum, r) => sum + (r.annualSavingsKWh || 0), 0);
    const totalAnnualSavings = itemResults.reduce((sum, r) => sum + (r.annualSavings || 0), 0);
    const totalCarbonReduction = itemResults.reduce((sum, r) => sum + (r.carbonReduction || 0), 0);
    const totalEquipmentCost = itemResults.reduce((sum, r) => sum + (r.equipmentCost || 0), 0);

    let totalEstimatedSubsidy = itemResults.reduce((sum, r) => sum + (r.estimatedSubsidy || 0), 0);
    
    if (utility === 'CLP') {
      const clpCap = req.body.clpType === 'largeHighDemand' ? 200000 : 10000;
      totalEstimatedSubsidy = Math.min(totalEstimatedSubsidy, clpCap);
    } else if (utility === 'HEC') {
      totalEstimatedSubsidy = Math.min(totalEstimatedSubsidy, 150000);
    }

    const subsidyRate = totalEquipmentCost > 0 ? totalEstimatedSubsidy / totalEquipmentCost : 0;
    const netInvestment = totalEquipmentCost - totalEstimatedSubsidy;
    const paybackPeriod = totalAnnualSavings > 0 ? (netInvestment / totalAnnualSavings) * 12 : 0;

    res.json({
      success: true,
      data: {
        items: itemResults,
        summary: {
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
          itemCount: items.length
        }
      }
    });

  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      error: '计算失败',
      message: error.message
    });
  }
});

export default router;
