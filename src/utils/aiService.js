/**
 * Calls the backend proxy at /api/analyze which holds the Gemini API key.
 * Images are sent as base64 inline-data parts – same schema Gemini expects,
 * so the backend can forward them as-is.
 */

const fileToGenerativePart = async (file) => {
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: base64, mimeType: file.type },
  };
};

export const analyzeImages = async (
  electricityBillFiles,
  efficiencyLabelFiles,
  oldEfficiencyLabelFiles,
  financialFiles,
  utility,
  installationType
) => {
  const allFiles = [
    ...(electricityBillFiles || []),
    ...(efficiencyLabelFiles || []),
    ...(oldEfficiencyLabelFiles || []),
    ...(financialFiles || []),
  ];

  console.log('Sending analysis request to backend proxy...');

  const utilitySpecificInstructions =
    utility === 'CLP'
      ? `【中電 (CLP) 專屬要求】：
       - 功率單位：請將所有功率識別並換算為 **千瓦 (kW)**。
       - 費用提取：請提取發票上的 **設備購買單價 (Unit Price)**。
       - 電價提取：請從電費單「電力費用」部分提取「每度 (¢)」。注意：實際電價 = 基本電費 + 燃料調整費 - 節能回扣。請盡量計算出最終的 HKD/kWh。
       - 額外欄位：請識別設備的「輸出 (Output, kW)」。
       - 匹數識別 (重要)：對於冷氣設備，請務必從能效標籤或單據中識別匹數 (HP)，填入 capacity / oldCapacity 欄位。常見標示方式包括：直接標示「X 匹」或「X HP」，或根據製冷量推算（1 匹 ≈ 2.5 kW 製冷量 ≈ 9,000 BTU/h）。例如：12,000 BTU/h 或 3.5 kW 製冷量的設備約為 1.5 匹。請以字串形式填入（如 "1.5"、"2"）。`
      : `【港燈 (HEC) 專屬要求】：
       - 功率單位：請保留 **瓦 (W)** 為單位，切勿換算為 kW。
       - 費用提取：請提取發票上的 **項目費用總額 (Total Amount)**，需包含設備費與安裝費。
       - 電價提取：請從電費單提取實際每度電收費 (HKD/kWh)。
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

  【製冷量單位規範 (重要)】：
  - coolingCapacity 與 oldCoolingCapacity 必須以 **千瓦 (kW)** 為單位輸出，切勿填入 BTU/h 的數值。
  - 若單據上同時標示 kW 與 BTU/h（例如「3.50 kW (12,000 BTU/h)」），請優先採用 kW 的數值（此例應填 3.5），不得填 12000。
  - 若單據上只有 BTU/h，請換算為 kW：kW = BTU/h ÷ 3412，四捨五入至小數點後兩位。
  - 若單據上只有匹數 (HP)，請將匹數填入 capacity/oldCapacity 欄位，並盡量換算成 kW 填入 coolingCapacity（1 HP ≈ 2.5 kW 製冷量，作參考）。

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

  // Call our own backend – never expose the API key
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      imageParts,
      model: 'gemini-2.5-flash',
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Backend returned ${response.status}`);
  }

  const { result } = await response.json();
  const aiResult = JSON.parse(result);
  const items = Array.isArray(aiResult) ? aiResult : [aiResult];

  return items.map((item) => ({
    ...item,
    utility,
    installationType,
    purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
    oldRatedPower: item.oldRatedPower || 0,
    ratedPower: item.ratedPower || 0,
    equipmentCost: item.equipmentCost || 0,
    quantity: item.quantity || 1,
    coolingCapacity: item.coolingCapacity || 0,
    oldCoolingCapacity: item.oldCoolingCapacity || 0,
    output: item.output || 0,
  }));
};
