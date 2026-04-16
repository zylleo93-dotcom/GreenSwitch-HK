import { GoogleGenAI } from "@google/genai";
import { mockAnalyzeImages } from "./mockAI.js";
import { getFilesCombinedHash } from "./hashUtils.js";

// 只有在 Firebase 设置好后才导入
let db = null;
const initDb = async () => {
  if (db) return db;
  try {
    const firebaseModule = await import("../lib/firebase.js").catch(() => null);
    if (firebaseModule) {
      db = firebaseModule.db;
    }
  } catch (e) {
    console.warn("Firebase not initialized yet, caching will be disabled.");
  }
  return db;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 从 Firestore 获取缓存结果
 */
const getCachedResult = async (hash) => {
  const database = await initDb();
  if (!database || !hash) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(database, "ai_cache", hash);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Using Cached AI Result (Hash: " + hash + ")");
      return docSnap.data().result;
    }
  } catch (e) {
    console.error("Error reading cache:", e);
  }
  return null;
};

/**
 * 将结果存入 Firestore 缓存
 */
const setCachedResult = async (hash, result) => {
  const database = await initDb();
  if (!database || !hash) return;
  try {
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(database, "ai_cache", hash), {
      result,
      createdAt: serverTimestamp(),
    });
    console.log("AI Result Cached (Hash: " + hash + ")");
  } catch (e) {
    console.error("Error writing cache:", e);
  }
};

/**
 * 将文件转换为 Base64
 */
const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const analyzeImages = async (electricityBillFiles, efficiencyLabelFiles, oldEfficiencyLabelFiles, financialFiles, utility, installationType) => {
  // 1. 计算组合哈希值
  const allFiles = [
    ...(electricityBillFiles || []),
    ...(efficiencyLabelFiles || []),
    ...(oldEfficiencyLabelFiles || []),
    ...(financialFiles || [])
  ];
  
  const combinedHash = await getFilesCombinedHash(allFiles);
  
  // 2. 检查缓存
  const cached = await getCachedResult(combinedHash);
  if (cached) return cached;

  console.log("No cache found, calling Gemini AI...");

  const model = "gemini-3-flash-preview";
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

  const imageParts = await Promise.all(allFiles.map(fileToGenerativePart));
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }, ...imageParts] }],
      config: { responseMimeType: "application/json" }
    });
    
    const aiResult = JSON.parse(response.text);
    // 确保返回的是数组
    const items = Array.isArray(aiResult) ? aiResult : [aiResult];
    
    const finalResult = items.map(item => ({
      ...item,
      utility,
      installationType,
      purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
      // 确保数值字段不为 null，方便前端处理
      oldRatedPower: item.oldRatedPower || 0,
      ratedPower: item.ratedPower || 0,
      equipmentCost: item.equipmentCost || 0,
      quantity: item.quantity || 1,
      coolingCapacity: item.coolingCapacity || 0,
      oldCoolingCapacity: item.oldCoolingCapacity || 0,
      output: item.output || 0
    }));
    
    // 4. 存入缓存
    await setCachedResult(combinedHash, finalResult);
    return finalResult;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // 降级到空结果或抛出错误
    throw error;
  }
};
