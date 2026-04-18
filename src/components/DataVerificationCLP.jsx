import React, { useState, useMemo, useRef } from 'react';
import { CheckCircle, Zap, Plus, Trash2, ChevronRight, X, Upload, FileText, Camera, DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './FileUpload.jsx';
import { analyzeImages } from '../utils/aiService.js';

const DataVerificationCLP = ({ data, onDataChange, onConfirm, globalFiles, onGlobalFileUpload, onGlobalFileDelete }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [deviceFiles, setDeviceFiles] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const globalFileInputRef = useRef(null);

  const handleRemoveDeviceFile = (rowId, index) => {
    setDeviceFiles(prev => {
      const updated = [...(prev[rowId] || [])];
      updated.splice(index, 1);
      return {
        ...prev,
        [rowId]: updated
      };
    });
  };

  const items = useMemo(() => data.items || [], [data.items]);
  const [activeTab, setActiveTab] = useState('AC_GRADE1');

  const editingItem = useMemo(() => items.find(i => i.id === editingRowId), [items, editingRowId]);

  const handleOpenDrawer = (rowId) => {
    setEditingRowId(rowId);
    setDrawerOpen(true);
  };

  const handleRunAI = async (isSingleRow = false) => {
    setIsAnalyzing(true);
    setShowConfirm(false);
    try {
      let filesToAnalyze = { ...globalFiles };
      
      // If single row re-identification, prioritize device-specific files
      if (isSingleRow && editingRowId) {
        const specificFiles = deviceFiles[editingRowId] || [];
        if (specificFiles.length > 0) {
          // For single row, we'll add them to the analysis pool
          const images = specificFiles
            .map(f => f.file)
            .filter(f => f && f.type.startsWith('image/'));
          filesToAnalyze.efficiency = [...filesToAnalyze.efficiency, ...images];
        }
      }

      const results = await analyzeImages(
        filesToAnalyze.electricity,
        filesToAnalyze.efficiency,
        filesToAnalyze.oldEfficiency,
        filesToAnalyze.financial,
        'CLP',
        data.installationType || 'replacement'
      );

      if (results && results.length > 0) {
        if (isSingleRow && editingRowId) {
          // Update only the specific row
          const aiResult = results[0];
          const sanitizedResult = Object.fromEntries(
            Object.entries(aiResult).map(([k, v]) => [k, v ?? (initialItemState[k] ?? '')])
          );
          const updatedItems = items.map(item => 
            item.id === editingRowId 
              ? { 
                  ...item, 
                  ...sanitizedResult, 
                  isAiGenerated: true,
                  id: item.id,
                  projectId: item.projectId
                } 
              : item
          );
          onDataChange({ ...data, items: updatedItems, confidence: 0.95 });
        } else {
          // Global update: map results to items
          const newItems = results.map((res, idx) => {
            const sanitizedRes = Object.fromEntries(
              Object.entries(res).map(([k, v]) => [k, v ?? (initialItemState[k] ?? '')])
            );
            return {
              ...initialItemState,
              ...sanitizedRes,
              id: Date.now() + idx,
              projectId: `proj_${Date.now()}_${idx}`,
              isNewInstallation: data.installationType === 'new',
              isAiGenerated: true
            };
          });

          onDataChange({ 
            ...data, 
            items: newItems,
            confidence: results.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / results.length
          });
          
          // Switch to the tab of the first recognized device
          if (newItems.length > 0) {
            setActiveTab(newItems[0].deviceType || activeTab);
          }
        }
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isAllFilesUploaded = 
    globalFiles.electricity.length > 0 && 
    globalFiles.oldEfficiency.length > 0 && 
    globalFiles.efficiency.length > 0 && 
    globalFiles.financial.length > 0;

  const defaultAnnualHours = (data.step1OperatingHours || 8) * 365;

  const initialItemState = {
    // Common fields
    brand: '',
    model: '',
    quantity: 1,
    ratedPower: 0,
    installLocation: '',
    loadFactor: 70,
    operatingHours: defaultAnnualHours,
    equipmentCost: 0,
    electricityPrice: 0, // Add this
    purchaseDate: new Date().toISOString().split('T')[0],
    actualQuantity: 1,
    
    // Old equipment fields (for Retrofit)
    oldBrand: '',
    oldModel: '',
    oldQuantity: 1,
    oldRatedPower: 0,
    oldInstallLocation: '',
    oldLoadFactor: 70,
    oldOperatingHours: defaultAnnualHours,
    oldEquipmentType: '分體式',

    // Specific fields
    capacity: '', // Tab 1
    oldCapacity: '', // Tab 1
    
    coolingCapacity: 0, // Tab 2
    oldCoolingCapacity: 0, // Tab 2
    category: '單式組裝空調機', // Tab 2
    oldCategory: '單式組裝空調機', // Tab 2
    airOrWaterCooled: '氣冷式', // Tab 2 New
    oldAirOrWaterCooled: '氣冷式', // Tab 2 Old
    equipmentType: '分體式', // Tab 2 New Unitary
    compressorType: '往復式', // Tab 2 New Chiller
    
    length: '', // Tab 3
    oldLength: '', // Tab 3
    diameter: '', // Tab 3
    oldDiameter: '', // Tab 3
    subType: 'LED 燈膽', // Tab 3
    oldSubType: 'LED 燈膽', // Tab 3
    
    output: 0, // Tab 4
    oldOutput: 0, // Tab 4
    deviceType: '空氣壓縮機', // Tab 4
    oldDeviceType: '空氣壓縮機', // Tab 4
    energySavingFeature: '', // Tab 4 New
  };

  // Group items by projectId
  const sortedGroups = useMemo(() => {
    const currentItems = data.items || [];
    const tabItems = currentItems.filter(item => item.deviceType === activeTab);
    const projectMap = new Map();

    tabItems.forEach(item => {
      const pId = item.projectId || item.id;
      if (!projectMap.has(pId)) {
        projectMap.set(pId, {
          projectId: pId,
          isNewInstallation: item.isNewInstallation || false,
          rows: []
        });
      }
      projectMap.get(pId).rows.push(item);
    });

    const groups = Array.from(projectMap.values());
    const replacements = groups.filter(g => !g.isNewInstallation);
    const newAdditions = groups.filter(g => g.isNewInstallation);

    let displayNo = 1;
    replacements.forEach(g => g.displayNo = displayNo++);
    newAdditions.forEach(g => g.displayNo = displayNo++);

    return [...replacements, ...newAdditions];
  }, [data.items, activeTab]);

  const handleAddProject = () => {
    const newProjectId = `proj_${Date.now()}`;
    const newItem = {
      ...initialItemState,
      id: Date.now(),
      projectId: newProjectId,
      isNewInstallation: false, // Default to Replacement
      deviceType: activeTab,
    };
    onDataChange({ ...data, items: [...items, newItem] });
  };

  const handleAddRow = (projectId, isNewInstallation) => {
    const newItem = {
      ...initialItemState,
      id: Date.now(),
      projectId: projectId,
      isNewInstallation: isNewInstallation,
      deviceType: activeTab,
    };
    onDataChange({ ...data, items: [...items, newItem] });
  };

  const handleProjectTypeChange = (projectId, isNew) => {
    const newItems = items.map(item => {
      if (item.projectId === projectId) {
        return { ...item, isNewInstallation: isNew };
      }
      return item;
    });
    onDataChange({ ...data, items: newItems });
  };

  const handleItemChange = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onDataChange({ ...data, items: newItems });
  };

  const handleRemoveRow = (id) => {
    const newItems = items.filter(item => item.id !== id);
    onDataChange({ ...data, items: newItems });
    // Clear validation error for this row if any
    if (validationErrors[id]) {
      const newErrors = { ...validationErrors };
      delete newErrors[id];
      setValidationErrors(newErrors);
    }
  };

  const validateData = () => {
    const errors = {};
    let isValid = true;

    items.forEach(item => {
      const rowErrors = [];
      const isNew = item.isNewInstallation;

      // Fields to check for all tabs (New Equipment)
      const commonNewFields = ['brand', 'model', 'quantity', 'ratedPower', 'operatingHours', 'installLocation', 'equipmentCost', 'purchaseDate', 'actualQuantity'];
      const commonOldFields = ['oldBrand', 'oldModel', 'oldQuantity', 'oldRatedPower', 'oldOperatingHours', 'oldInstallLocation'];

      if (item.deviceType === 'AC_GRADE1') {
        [...commonNewFields, 'capacity', 'loadFactor'].forEach(f => {
          if (!item[f] && item[f] !== 0) rowErrors.push(f);
        });
        if (!isNew) {
          [...commonOldFields, 'oldCapacity', 'oldLoadFactor'].forEach(f => {
            if (!item[f] && item[f] !== 0) rowErrors.push(f);
          });
        }
      } else if (item.deviceType === 'AC_SYSTEM') {
        [...commonNewFields, 'category', 'airOrWaterCooled', 'equipmentType', 'coolingCapacity', 'loadFactor'].forEach(f => {
          if (!item[f] && item[f] !== 0) rowErrors.push(f);
        });
        if (!isNew) {
          [...commonOldFields, 'oldCategory', 'oldAirOrWaterCooled', 'oldEquipmentType', 'oldCoolingCapacity', 'oldLoadFactor'].forEach(f => {
            if (!item[f] && item[f] !== 0) rowErrors.push(f);
          });
        }
      } else if (item.deviceType === 'LED_LIGHTING') {
        ['brand', 'subType', 'quantity', 'ratedPower', 'operatingHours', 'installLocation', 'equipmentCost', 'purchaseDate', 'actualQuantity'].forEach(f => {
          if (!item[f] && item[f] !== 0) rowErrors.push(f);
        });
        if (!isNew) {
          ['oldSubType', 'oldQuantity', 'oldRatedPower', 'oldOperatingHours', 'oldInstallLocation'].forEach(f => {
            if (!item[f] && item[f] !== 0) rowErrors.push(f);
          });
        }
      } else if (item.deviceType === 'OTHER_EQUIP') {
        [...commonNewFields, 'deviceType', 'output', 'loadFactor'].forEach(f => {
          if (!item[f] && item[f] !== 0) rowErrors.push(f);
        });
        if (!isNew) {
          [...commonOldFields, 'oldDeviceType', 'oldOutput', 'oldLoadFactor'].forEach(f => {
            if (!item[f] && item[f] !== 0) rowErrors.push(f);
          });
        }
      }

      if (rowErrors.length > 0) {
        errors[item.id] = rowErrors;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleConfirm = () => {
    if (validateData()) {
      onConfirm();
    } else {
      // Find the first tab with errors and switch to it
      const firstErrorId = Object.keys(validationErrors)[0] || (items.length > 0 ? items[0].id : null);
      if (firstErrorId) {
        const errorItem = items.find(i => i.id === Number(firstErrorId));
        if (errorItem && errorItem.deviceType !== activeTab) {
          setActiveTab(errorItem.deviceType);
        }
      }
    }
  };

  const calculateItemSavings = (item) => {
    const isNew = item.isNewInstallation;
    const hours = item.operatingHours || defaultAnnualHours;
    const loadFactor = (item.loadFactor || 70) / 100;
    const oldHours = item.oldOperatingHours || defaultAnnualHours;
    const oldLoadFactor = (item.oldLoadFactor || 70) / 100;

    let oldConsumption = 0;
    let newConsumption = 0;

    if (item.deviceType === 'LED_LIGHTING') {
      newConsumption = (item.quantity * item.ratedPower / 1000) * hours;
      if (!isNew) {
        oldConsumption = (item.oldQuantity * item.oldRatedPower / 1000) * oldHours;
      }
    } else {
      newConsumption = item.quantity * item.ratedPower * hours * loadFactor;
      if (!isNew) {
        oldConsumption = item.oldQuantity * item.oldRatedPower * oldHours * oldLoadFactor;
      }
    }

    return {
      oldConsumption,
      newConsumption,
      savings: Math.max(0, oldConsumption - newConsumption)
    };
  };

  const tabs = [
    { id: 'AC_GRADE1', name: '一级能源标签空调 (Sheet A)' },
    { id: 'AC_SYSTEM', name: '空调系统 (Sheet B1/B2)' },
    { id: 'LED_LIGHTING', name: 'LED 照明 (Sheet C)' },
    { id: 'OTHER_EQUIP', name: '其他设备 (Sheet D)' },
  ];

  const LocationInput = ({ value, onChange, className }) => {
    const commonLocations = ['辦公室', '走廊', '大堂', '洗手間', '機房', '商舖', '倉庫'];
    const isOther = value !== '' && !commonLocations.includes(value);

    return (
      <div className="flex flex-col space-y-1">
        <select 
          className={className}
          value={isOther ? '其他' : (commonLocations.includes(value) ? value : '')}
          onChange={(e) => {
            if (e.target.value === '其他') {
              onChange(' '); // Use space to trigger other mode
            } else {
              onChange(e.target.value);
            }
          }}
        >
          <option value="">請選擇地點</option>
          {commonLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          <option value="其他">其他...</option>
        </select>
        {(isOther || value === ' ') && (
          <input 
            placeholder="請輸入地點"
            className={className}
            value={value === ' ' ? '' : value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    );
  };

  const renderTableContent = () => {
    const tableHeaderClass = "px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 sticky top-0 z-10";
    const tableCellClass = "px-3 py-4 whitespace-nowrap text-sm border-b border-slate-100";
    const inputClass = "w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all";
    const getFieldClass = (itemId, field) => {
      const hasError = validationErrors[itemId]?.includes(field);
      return `${inputClass} ${hasError ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : ''}`;
    };
    const readOnlyClass = "w-full px-2 py-1 bg-slate-50 border border-transparent rounded text-xs font-bold text-slate-600";

    const renderOldTable = (headers) => {
      const oldGroups = sortedGroups.filter(g => !g.isNewInstallation);
      return (
        <div className="mb-8">
          <div className="px-6 py-3 bg-slate-100/50 border-y border-slate-200">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">舊有設備數據 (Old Equipment)</h5>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>項目編號</th>
                {headers.map(h => <th key={h} className={tableHeaderClass}>{h}</th>)}
                <th className={tableHeaderClass}>資料核對 / 管理</th>
              </tr>
            </thead>
            <tbody>
              {oldGroups.map((group) => (
                <React.Fragment key={`old-${group.projectId}`}>
                  {group.rows.map((item) => {
                    const { oldConsumption } = calculateItemSavings(item);
                    const fileCount = (deviceFiles[item.id]?.length || 0) + 
                                     (Object.values(globalFiles).flat().length);
                    return (
                      <tr key={`old-row-${item.id}`} className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${item.isAiGenerated ? 'bg-amber-50/5' : ''}`}>
                        <td className={tableCellClass}>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-400">{group.displayNo}</span>
                            {item.isAiGenerated && (
                              <div className="flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" title="AI 自動生成">
                                <Zap className="w-2.5 h-2.5 mr-0.5 fill-amber-500" />
                                AI
                              </div>
                            )}
                          </div>
                        </td>
                        {activeTab === 'AC_GRADE1' && (
                          <>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'oldBrand')} value={item.oldBrand ?? ''} onChange={(e) => handleItemChange(item.id, 'oldBrand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'oldModel')} value={item.oldModel ?? ''} onChange={(e) => handleItemChange(item.id, 'oldModel', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><input placeholder="匹數" className={getFieldClass(item.id, 'oldCapacity')} value={item.oldCapacity ?? ''} onChange={(e) => handleItemChange(item.id, 'oldCapacity', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldQuantity')} value={item.oldQuantity ?? ''} onChange={(e) => handleItemChange(item.id, 'oldQuantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldRatedPower')} value={item.oldRatedPower ?? ''} onChange={(e) => handleItemChange(item.id, 'oldRatedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOperatingHours')} value={item.oldOperatingHours ?? ''} onChange={(e) => handleItemChange(item.id, 'oldOperatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldLoadFactor')} value={item.oldLoadFactor ?? ''} onChange={(e) => handleItemChange(item.id, 'oldLoadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(oldConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'oldInstallLocation')} value={item.oldInstallLocation ?? ''} onChange={(val) => handleItemChange(item.id, 'oldInstallLocation', val)} /></td>
                          </>
                        )}
                        {activeTab === 'AC_SYSTEM' && (
                          <>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'oldBrand')} value={item.oldBrand} onChange={(e) => handleItemChange(item.id, 'oldBrand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'oldModel')} value={item.oldModel} onChange={(e) => handleItemChange(item.id, 'oldModel', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'oldCategory')} value={item.oldCategory} onChange={(e) => handleItemChange(item.id, 'oldCategory', e.target.value)}>{['單式組裝空調機', '可變冷凍劑流量系統', '冷水機'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'oldAirOrWaterCooled')} value={item.oldAirOrWaterCooled} onChange={(e) => handleItemChange(item.id, 'oldAirOrWaterCooled', e.target.value)}>{['氣冷式', '水冷式'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'oldEquipmentType')} value={item.oldEquipmentType} onChange={(e) => handleItemChange(item.id, 'oldEquipmentType', e.target.value)}>{['分體式', '非分體式', '螺桿式', '離心式'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldCoolingCapacity')} value={item.oldCoolingCapacity} onChange={(e) => handleItemChange(item.id, 'oldCoolingCapacity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldQuantity')} value={item.oldQuantity ?? ''} onChange={(e) => handleItemChange(item.id, 'oldQuantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldRatedPower')} value={item.oldRatedPower ?? ''} onChange={(e) => handleItemChange(item.id, 'oldRatedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOperatingHours')} value={item.oldOperatingHours ?? ''} onChange={(e) => handleItemChange(item.id, 'oldOperatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldLoadFactor')} value={item.oldLoadFactor ?? ''} onChange={(e) => handleItemChange(item.id, 'oldLoadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(oldConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'oldInstallLocation')} value={item.oldInstallLocation} onChange={(val) => handleItemChange(item.id, 'oldInstallLocation', val)} /></td>
                          </>
                        )}
                        {activeTab === 'LED_LIGHTING' && (
                          <>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'oldSubType')} value={item.oldSubType} onChange={(e) => handleItemChange(item.id, 'oldSubType', e.target.value)}>{['LED 燈膽', 'LED 筒燈', 'LED 光管', 'LED 燈帶'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><input placeholder="長度" className={getFieldClass(item.id, 'oldLength')} value={item.oldLength} onChange={(e) => handleItemChange(item.id, 'oldLength', e.target.value)} disabled={item.oldSubType !== 'LED 光管'} /></td>
                            <td className={tableCellClass}><input placeholder="直徑" className={getFieldClass(item.id, 'oldDiameter')} value={item.oldDiameter} onChange={(e) => handleItemChange(item.id, 'oldDiameter', e.target.value)} disabled={item.oldSubType !== 'LED 光管'} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldQuantity')} value={item.oldQuantity} onChange={(e) => handleItemChange(item.id, 'oldQuantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldRatedPower')} value={item.oldRatedPower} onChange={(e) => handleItemChange(item.id, 'oldRatedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOperatingHours')} value={item.oldOperatingHours} onChange={(e) => handleItemChange(item.id, 'oldOperatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(oldConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'oldInstallLocation')} value={item.oldInstallLocation} onChange={(val) => handleItemChange(item.id, 'oldInstallLocation', val)} /></td>
                          </>
                        )}
                        {activeTab === 'OTHER_EQUIP' && (
                          <>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'oldBrand')} value={item.oldBrand} onChange={(e) => handleItemChange(item.id, 'oldBrand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'oldModel')} value={item.oldModel} onChange={(e) => handleItemChange(item.id, 'oldModel', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'oldDeviceType')} value={item.oldDeviceType} onChange={(e) => handleItemChange(item.id, 'oldDeviceType', e.target.value)}>{['空氣壓縮機', '冷凍機', '其他'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOutput')} value={item.oldOutput} onChange={(e) => handleItemChange(item.id, 'oldOutput', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldRatedPower')} value={item.oldRatedPower} onChange={(e) => handleItemChange(item.id, 'oldRatedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOperatingHours')} value={item.oldOperatingHours} onChange={(e) => handleItemChange(item.id, 'oldOperatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldLoadFactor')} value={item.oldLoadFactor} onChange={(e) => handleItemChange(item.id, 'oldLoadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldQuantity')} value={item.oldQuantity} onChange={(e) => handleItemChange(item.id, 'oldQuantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(oldConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'oldInstallLocation')} value={item.oldInstallLocation} onChange={(val) => handleItemChange(item.id, 'oldInstallLocation', val)} /></td>
                          </>
                        )}
                        <td className={tableCellClass}>
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenDrawer(item.id)}
                              className={`p-1.5 rounded transition-all flex items-center space-x-1.5 border ${
                                (deviceFiles[item.id]?.length || 0) > 0 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                              }`}
                              title="查看文件與核對資料"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">核對資料</span>
                              {fileCount > 0 && (
                                <span className="bg-amber-500 text-white text-[9px] px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                                  {fileCount}
                                </span>
                              )}
                            </button>
                            <button onClick={() => handleRemoveRow(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="刪除此行">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/50">
                    <td colSpan={100} className="px-3 py-2 text-center border-b border-slate-200">
                      <button onClick={() => handleAddRow(group.projectId, false)} className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center justify-center w-full">
                        <Plus className="w-3 h-3 mr-1" /> 增加行 (項目 {group.displayNo})
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const renderNewTable = (headers) => {
      return (
        <div>
          <div className="px-6 py-3 bg-amber-50/50 border-y border-amber-100">
            <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">新安裝設備數據 (New Equipment)</h5>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>項目編號</th>
                {headers.map(h => <th key={h} className={tableHeaderClass}>{h}</th>)}
                <th className={tableHeaderClass}>資料核對 / 管理</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => (
                <React.Fragment key={`new-${group.projectId}`}>
                  {group.rows.map((item, idx) => {
                    const { newConsumption, savings } = calculateItemSavings(item);
                    const fileCount = (deviceFiles[item.id]?.length || 0) + 
                                     (Object.values(globalFiles).flat().length);
                    return (
                      <tr key={`new-row-${item.id}`} className={`hover:bg-amber-50/30 transition-colors border-b border-slate-100 ${item.isAiGenerated ? 'bg-amber-50/5' : ''}`}>
                        <td className={tableCellClass}>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-400">{group.displayNo}</span>
                            {item.isAiGenerated && (
                              <div className="flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" title="AI 自動生成">
                                <Zap className="w-2.5 h-2.5 mr-0.5 fill-amber-500" />
                                AI
                              </div>
                            )}
                          </div>
                        </td>
                        {activeTab === 'AC_GRADE1' && (
                          <>
                            <td className={tableCellClass}>
                              {idx === 0 ? (
                                <select className={getFieldClass(item.id, 'isNewInstallation')} value={group.isNewInstallation ? 'new' : 'replacement'} onChange={(e) => handleProjectTypeChange(group.projectId, e.target.value === 'new')}>
                                  <option value="replacement">更換</option>
                                  <option value="new">新添置</option>
                                </select>
                              ) : (
                                <div className="text-xs text-slate-500">{group.isNewInstallation ? '新添置' : '更換'}</div>
                              )}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'brand')} value={item.brand} onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'model')} value={item.model} onChange={(e) => handleItemChange(item.id, 'model', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><input placeholder="匹數" className={getFieldClass(item.id, 'capacity')} value={item.capacity} onChange={(e) => handleItemChange(item.id, 'capacity', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'ratedPower')} value={item.ratedPower} onChange={(e) => handleItemChange(item.id, 'ratedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'operatingHours')} value={item.operatingHours} onChange={(e) => handleItemChange(item.id, 'operatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'loadFactor')} value={item.loadFactor} onChange={(e) => handleItemChange(item.id, 'loadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(newConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><div className={`${readOnlyClass} text-emerald-600`}>{Math.round(savings).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'installLocation')} value={item.installLocation} onChange={(val) => handleItemChange(item.id, 'installLocation', val)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'equipmentCost')} value={item.equipmentCost} onChange={(e) => handleItemChange(item.id, 'equipmentCost', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="date" className={getFieldClass(item.id, 'purchaseDate')} value={item.purchaseDate} onChange={(e) => handleItemChange(item.id, 'purchaseDate', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'actualQuantity')} value={item.actualQuantity || 1} onChange={(e) => handleItemChange(item.id, 'actualQuantity', Number(e.target.value))} /></td>
                          </>
                        )}
                        {activeTab === 'AC_SYSTEM' && (
                          <>
                            <td className={tableCellClass}>
                              {idx === 0 ? (
                                <select className={getFieldClass(item.id, 'isNewInstallation')} value={group.isNewInstallation ? 'new' : 'replacement'} onChange={(e) => handleProjectTypeChange(group.projectId, e.target.value === 'new')}>
                                  <option value="replacement">更換</option>
                                  <option value="new">新添置</option>
                                </select>
                              ) : (
                                <div className="text-xs text-slate-500">{group.isNewInstallation ? '新添置' : '更換'}</div>
                              )}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'brand')} value={item.brand} onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'model')} value={item.model} onChange={(e) => handleItemChange(item.id, 'model', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'category')} value={item.category} onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}>{['單式組裝空調機', '可變冷凍劑流量系統', '冷水機'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'airOrWaterCooled')} value={item.airOrWaterCooled} onChange={(e) => handleItemChange(item.id, 'airOrWaterCooled', e.target.value)}>{['氣冷式', '水冷式'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}>
                              {group.isNewInstallation ? (
                                item.category === '可變冷凍劑流量系統' ? (
                                  <div className="text-center text-slate-400">-</div>
                                ) : item.category === '冷水機' ? (
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-[10px] text-amber-600 font-bold leading-none">壓縮機種類</span>
                                    <select className={getFieldClass(item.id, 'compressorType')} value={item.compressorType || '往復式'} onChange={(e) => handleItemChange(item.id, 'compressorType', e.target.value)}>
                                      {['往復式', '渦旋式', '螺桿式', '可變速驅動器螺桿式', '離心式', '可變速驅動器離心式'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-[10px] text-amber-600 font-bold leading-none">設備種類</span>
                                    <select className={getFieldClass(item.id, 'equipmentType')} value={item.equipmentType} onChange={(e) => handleItemChange(item.id, 'equipmentType', e.target.value)}>
                                      {['分體式', '非分體式'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  </div>
                                )
                              ) : (
                                <select className={getFieldClass(item.id, 'equipmentType')} value={item.equipmentType} onChange={(e) => handleItemChange(item.id, 'equipmentType', e.target.value)}>
                                  {['分體式', '非分體式', '螺桿式', '離心式'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              )}
                            </td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'coolingCapacity')} value={item.coolingCapacity} onChange={(e) => handleItemChange(item.id, 'coolingCapacity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'ratedPower')} value={item.ratedPower} onChange={(e) => handleItemChange(item.id, 'ratedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'operatingHours')} value={item.operatingHours} onChange={(e) => handleItemChange(item.id, 'operatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'loadFactor')} value={item.loadFactor} onChange={(e) => handleItemChange(item.id, 'loadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(newConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><div className={`${readOnlyClass} text-emerald-600`}>{Math.round(savings).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'installLocation')} value={item.installLocation} onChange={(val) => handleItemChange(item.id, 'installLocation', val)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'equipmentCost')} value={item.equipmentCost} onChange={(e) => handleItemChange(item.id, 'equipmentCost', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="date" className={getFieldClass(item.id, 'purchaseDate')} value={item.purchaseDate} onChange={(e) => handleItemChange(item.id, 'purchaseDate', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'actualQuantity')} value={item.actualQuantity || 1} onChange={(e) => handleItemChange(item.id, 'actualQuantity', Number(e.target.value))} /></td>
                          </>
                        )}
                        {activeTab === 'LED_LIGHTING' && (
                          <>
                            <td className={tableCellClass}>
                              {idx === 0 ? (
                                <select className={getFieldClass(item.id, 'isNewInstallation')} value={group.isNewInstallation ? 'new' : 'replacement'} onChange={(e) => handleProjectTypeChange(group.projectId, e.target.value === 'new')}>
                                  <option value="replacement">更換</option>
                                  <option value="new">新添置</option>
                                </select>
                              ) : (
                                <div className="text-xs text-slate-500">{group.isNewInstallation ? '新添置' : '更換'}</div>
                              )}
                            </td>
                            <td className={tableCellClass}><input placeholder="品牌及型號" className={getFieldClass(item.id, 'brand')} value={item.brand} onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} /></td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'subType')} value={item.subType} onChange={(e) => handleItemChange(item.id, 'subType', e.target.value)}>{['LED 燈膽', 'LED 筒燈', 'LED 光管', 'LED 燈帶'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><input placeholder="長度" className={getFieldClass(item.id, 'length')} value={item.length} onChange={(e) => handleItemChange(item.id, 'length', e.target.value)} disabled={item.subType !== 'LED 光管' && item.subType !== 'LED 燈帶'} /></td>
                            <td className={tableCellClass}><input placeholder="直徑" className={getFieldClass(item.id, 'diameter')} value={item.diameter} onChange={(e) => handleItemChange(item.id, 'diameter', e.target.value)} disabled={item.subType !== 'LED 光管'} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'ratedPower')} value={item.ratedPower} onChange={(e) => handleItemChange(item.id, 'ratedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'operatingHours')} value={item.operatingHours} onChange={(e) => handleItemChange(item.id, 'operatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" step="0.01" className={getFieldClass(item.id, 'electricityPrice')} value={item.electricityPrice ?? ''} onChange={(e) => handleItemChange(item.id, 'electricityPrice', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(newConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><div className={`${readOnlyClass} text-emerald-600`}>{Math.round(savings).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'installLocation')} value={item.installLocation} onChange={(val) => handleItemChange(item.id, 'installLocation', val)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'equipmentCost')} value={item.equipmentCost} onChange={(e) => handleItemChange(item.id, 'equipmentCost', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="date" className={getFieldClass(item.id, 'purchaseDate')} value={item.purchaseDate} onChange={(e) => handleItemChange(item.id, 'purchaseDate', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'actualQuantity')} value={item.actualQuantity || 1} onChange={(e) => handleItemChange(item.id, 'actualQuantity', Number(e.target.value))} /></td>
                          </>
                        )}
                        {activeTab === 'OTHER_EQUIP' && (
                          <>
                            <td className={tableCellClass}>
                              {idx === 0 ? (
                                <select className={getFieldClass(item.id, 'isNewInstallation')} value={group.isNewInstallation ? 'new' : 'replacement'} onChange={(e) => handleProjectTypeChange(group.projectId, e.target.value === 'new')}>
                                  <option value="replacement">更換</option>
                                  <option value="new">新添置</option>
                                </select>
                              ) : (
                                <div className="text-xs text-slate-500">{group.isNewInstallation ? '新添置' : '更換'}</div>
                              )}
                            </td>
                            <td className={tableCellClass}>
                              <div className="flex flex-col space-y-1">
                                <input placeholder="品牌" className={getFieldClass(item.id, 'brand')} value={item.brand} onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} />
                                <input placeholder="型號" className={getFieldClass(item.id, 'model')} value={item.model} onChange={(e) => handleItemChange(item.id, 'model', e.target.value)} />
                              </div>
                            </td>
                            <td className={tableCellClass}><select className={getFieldClass(item.id, 'deviceType')} value={item.deviceType} onChange={(e) => handleItemChange(item.id, 'deviceType', e.target.value)}>{['空氣壓縮機', '冷凍機', '其他'].map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'output')} value={item.output} onChange={(e) => handleItemChange(item.id, 'output', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'ratedPower')} value={item.ratedPower} onChange={(e) => handleItemChange(item.id, 'ratedPower', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'operatingHours')} value={item.operatingHours} onChange={(e) => handleItemChange(item.id, 'operatingHours', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'loadFactor')} value={item.loadFactor} onChange={(e) => handleItemChange(item.id, 'loadFactor', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><div className={readOnlyClass}>{Math.round(newConsumption).toLocaleString()}</div></td>
                            <td className={tableCellClass}><div className={`${readOnlyClass} text-emerald-600`}>{Math.round(savings).toLocaleString()}</div></td>
                            <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'installLocation')} value={item.installLocation} onChange={(val) => handleItemChange(item.id, 'installLocation', val)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'equipmentCost')} value={item.equipmentCost} onChange={(e) => handleItemChange(item.id, 'equipmentCost', Number(e.target.value))} /></td>
                            <td className={tableCellClass}><input type="date" className={getFieldClass(item.id, 'purchaseDate')} value={item.purchaseDate} onChange={(e) => handleItemChange(item.id, 'purchaseDate', e.target.value)} /></td>
                            <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'actualQuantity')} value={item.actualQuantity || 1} onChange={(e) => handleItemChange(item.id, 'actualQuantity', Number(e.target.value))} /></td>
                          </>
                        )}
                        <td className={tableCellClass}>
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenDrawer(item.id)}
                              className={`p-1.5 rounded transition-all flex items-center space-x-1.5 border ${
                                (deviceFiles[item.id]?.length || 0) > 0 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                              }`}
                              title="查看文件與核對資料"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">核對資料</span>
                              {fileCount > 0 && (
                                <span className="bg-amber-500 text-white text-[9px] px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                                  {fileCount}
                                </span>
                              )}
                            </button>
                            <button onClick={() => handleRemoveRow(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="刪除此行">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-amber-50/20">
                    <td colSpan={100} className="px-3 py-2 text-center border-b border-amber-100">
                      <button onClick={() => handleAddRow(group.projectId, group.isNewInstallation)} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center w-full">
                        <Plus className="w-3 h-3 mr-1" /> 增加行 (項目 {group.displayNo})
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    switch(activeTab) {
      case 'AC_GRADE1': 
        return (
          <div className="min-w-[1400px]">
            {renderOldTable(["品牌及型號", "匹數", "數量 (a)", "額定輸入功率 (千瓦) (b)", "每年使用時數 (c)", "每年平均負荷系數 (%) (d)", "估計每年能源消耗量 (度電/年) (e)", "安裝地點"])}
            {renderNewTable(["更換或新添置", "品牌及型號", "匹數", "預計數量 (f)", "額定功率 (千瓦) (g)", "使用時數 (h)", "負荷系數 (%) (i)", "消耗量 (j)", "節省量 (k)", "安裝地點", "單價 (港幣)", "購買日期", "^ 實際安裝數量"])}
          </div>
        );
      case 'AC_SYSTEM':
        return (
          <div className="min-w-[1600px]">
            {renderOldTable(["品牌及型號", "系統類別", "氣冷/水冷", "設備種類", "製冷量 (千瓦)", "數量 (a)", "額定功率 (千瓦) (b)", "每年使用時數 (c)", "每年平均負荷系數 (%) (d)", "估計每年能源消耗量 (度電/年) (e)", "安裝地點"])}
            {renderNewTable(["更換或新添置", "品牌及型號", "系統類別", "氣冷/水冷", "設備種類 / 壓縮機種類", "製冷量 (千瓦)", "數量 (f)", "額定功率 (千瓦) (g)", "使用時數 (h)", "負荷系數 (%) (i)", "消耗量 (j)", "節省量 (k)", "安裝地點", "單價 (港幣)", "購買日期", "^ 實際安裝數量"])}
          </div>
        );
      case 'LED_LIGHTING':
        return (
          <div className="min-w-[1400px]">
            {renderOldTable(["設備種類", "長度 (毫米)", "直徑 (毫米)", "數量 (a)", "額定功率 (瓦) (b)", "每年使用時數 (c)", "估計每年能源消耗量 (度電/年) (d)", "安裝地點"])}
            {renderNewTable(["更換或新添置", "品牌及型號", "設備種類", "長度 (毫米)", "直徑 (毫米)", "數量 (e)", "額定功率 (瓦) (f)", "每年使用時數 (g)", "消耗量 (h)", "節省量 (i)", "安裝地點", "單價 (港幣)", "購買日期", "^ 實際安裝數量"])}
          </div>
        );
      case 'OTHER_EQUIP':
        return (
          <div className="min-w-[1400px]">
            {renderOldTable(["品牌及型號", "設備類型", "輸出 (千瓦)", "額定功率 (千瓦) (a)", "每年使用時數 (b)", "負荷系數 (%) (c)", "數量 (d)", "消耗量 (e)", "安裝地點"])}
            {renderNewTable(["更換或新添置", "品牌及型號", "設備類型", "輸出 (千瓦)", "額定功率 (f)", "使用時數 (g)", "負荷系數 (%) (h)", "數量 (i)", "消耗量 (j)", "節省量 (k)", "安裝地點", "單價 (港幣)", "購買日期", "^ 實際安裝數量"])}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Global Upload Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-amber-600" />
              第一步：上傳必要資料 (指定槽位)
            </h4>
            <p className="text-sm text-slate-500 mt-1">請將文件拖入對應區域，AI 將一次性分析所有資料以節省配額</p>
          </div>
          
          {/* Progress Checklist */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'electricity', label: '電費單' },
              { key: 'oldEfficiency', label: '舊標籤' },
              { key: 'efficiency', label: '新標籤' },
              { key: 'financial', label: '發票' }
            ].map(item => (
              <div 
                key={item.key}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center space-x-1.5 border transition-all ${
                  globalFiles[item.key].length > 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${globalFiles[item.key].length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>{item.label}</span>
                {globalFiles[item.key].length > 0 && <CheckCircle className="w-3 h-3" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FileUpload
            onFileUpload={(files) => onGlobalFileUpload('electricity', files)}
            title="電費單"
            description="分析電價基準"
            icon={FileText}
            multiple={true}
            files={globalFiles.electricity}
            colorClass="border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
            activeClass="border-amber-500 bg-amber-50"
            compact={true}
            hasFiles={globalFiles.electricity.length > 0}
          />
          <FileUpload
            onFileUpload={(files) => onGlobalFileUpload('oldEfficiency', files)}
            title="舊設備標籤"
            description="識別原始功率"
            icon={Camera}
            multiple={true}
            files={globalFiles.oldEfficiency}
            colorClass="border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
            activeClass="border-amber-500 bg-amber-50"
            compact={true}
            hasFiles={globalFiles.oldEfficiency.length > 0}
          />
          <FileUpload
            onFileUpload={(files) => onGlobalFileUpload('efficiency', files)}
            title="新設備標籤"
            description="識別型號功率"
            icon={Camera}
            multiple={true}
            files={globalFiles.efficiency}
            colorClass="border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
            activeClass="border-amber-500 bg-amber-50"
            compact={true}
            hasFiles={globalFiles.efficiency.length > 0}
          />
          <FileUpload
            onFileUpload={(files) => onGlobalFileUpload('financial', files)}
            title="新設備發票"
            description="核對單價日期"
            icon={DollarSign}
            multiple={true}
            files={globalFiles.financial}
            colorClass="border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
            activeClass="border-amber-500 bg-amber-50"
            compact={true}
            hasFiles={globalFiles.financial.length > 0}
          />
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!isAllFilesUploaded || isAnalyzing}
            className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 ${
              isAllFilesUploaded && !isAnalyzing
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI 正在全力分析中...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>{isAllFilesUploaded ? '✨ 啟動 AI 智能全方位識別' : '請補全資料以開始分析'}</span>
              </>
            )}
          </button>
          {!isAllFilesUploaded && (
            <p className="text-[10px] text-slate-400 mt-3 font-medium">
              * 為了節省您的 API 配額，請確保上傳所有必要文件後再開始分析
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowConfirm(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">確認開始 AI 分析？</h3>
              <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                系統將一次性分析您上傳的 {Object.values(globalFiles).flat().length} 份文件。請確保圖片清晰，尤其是功率和型號字樣。這將消耗一次 AI 識別配額。
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  返回檢查
                </button>
                <button 
                  onClick={handleRunAI}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all"
                >
                  確認分析
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-amber-500" />
          <h3 className="text-xl font-bold text-slate-900">中電 (CLP) 申報數據確認</h3>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleAddProject} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold flex items-center hover:bg-amber-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> 新增項目
          </button>
          <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider">AI 置信度: {(data.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-white sticky top-0 z-20 rounded-t-3xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-amber-500 text-amber-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-0 overflow-x-auto">
              {renderTableContent()}
            </div>
          </div>
          
          {/* Bottom Action Bar */}
          <div className="mt-8 flex flex-col items-center space-y-4">
            {Object.keys(validationErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl text-sm font-bold flex items-center animate-pulse">
                <X className="w-4 h-4 mr-2" />
                請補全所有標紅的必填欄位
              </div>
            )}
            <button 
              onClick={handleConfirm} 
              disabled={items.length === 0} 
              className={`px-12 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-3 ${
                items.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg'
              }`}
            >
              <span className="text-lg">生成Excel表格和节能效益分析报告</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {viewingCategory ? (
                      <button 
                        onClick={() => setViewingCategory(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors mr-2"
                      >
                        <X className="w-4 h-4 text-slate-500 rotate-90" />
                      </button>
                    ) : null}
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                      {viewingCategory ? {
                        electricity: '電費單據',
                        efficiency: '新設備能源標籤',
                        oldEfficiency: '舊設備能源標籤',
                        financial: '財務證明'
                      }[viewingCategory] : '設備文件管理'}
                    </h2>
                    {!viewingCategory && editingItem?.isAiGenerated && (
                      <div className="flex items-center bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
                        <Zap className="w-3 h-3 mr-1 fill-amber-500" />
                        AI 生成
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {viewingCategory ? '查看與管理已上傳的文件' : `項目編號: ${editingItem?.projectId || '---'}`}
                  </p>
                </div>
                <button onClick={() => { setDrawerOpen(false); setViewingCategory(null); }} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {viewingCategory ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {globalFiles[viewingCategory].map((file, idx) => (
                        <div 
                          key={idx} 
                          className="relative group aspect-[3/4] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                          onClick={() => setPreviewFile(file)}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            {file.type?.startsWith('image/') || (file instanceof File && file.type.startsWith('image/')) ? (
                              <img 
                                src={file.preview || (file instanceof File ? URL.createObjectURL(file) : '')} 
                                alt="preview" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center space-y-2">
                                <FileText className={`w-12 h-12 ${file.type === 'application/pdf' || (file instanceof File && file.type === 'application/pdf') ? 'text-red-400' : 'text-slate-300'}`} />
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{file.name}</span>
                                {(file.type === 'application/pdf' || (file instanceof File && file.type === 'application/pdf')) && (
                                  <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">PDF</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white font-bold truncate">{file.name}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onGlobalFileDelete(viewingCategory, idx);
                              setHasChanges(true);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      
                      <div 
                        onClick={() => globalFileInputRef.current.click()}
                        className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
                      >
                        <input 
                          type="file" 
                          ref={globalFileInputRef} 
                          className="hidden" 
                          multiple 
                          onChange={(e) => {
                            onGlobalFileUpload(viewingCategory, e.target.files, true);
                            setHasChanges(true);
                          }} 
                        />
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 group-hover:text-amber-600">上傳文件</span>
                      </div>

                      {globalFiles[viewingCategory].length === 0 && (
                        <div className="col-span-2 py-6 flex flex-col items-center justify-center text-slate-400 space-y-2">
                          <p className="text-[10px] font-medium">點擊上方按鈕開始上傳</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                          <h3 className="text-sm font-black text-slate-800">當前設備文件 (專屬)</h3>
                        </div>
                        <button 
                          onClick={() => handleRunAI(true)}
                          disabled={isAnalyzing || (!hasChanges && (!deviceFiles[editingRowId] || deviceFiles[editingRowId].length === 0))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center space-x-1.5 transition-all ${
                            isAnalyzing || (!hasChanges && (!deviceFiles[editingRowId] || deviceFiles[editingRowId].length === 0))
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200'
                          }`}
                        >
                          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          <span>僅重新分析此行</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                        您可以重新上傳此設備的專屬文件（如銘牌照片）以進行單獨分析，或者直接在表格中手動修改數據。
                      </p>

                      <div className="grid grid-cols-1 gap-4">
                        {deviceFiles[editingRowId]?.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {deviceFiles[editingRowId].map((file, idx) => (
                              <div key={idx} className="relative group aspect-video">
                                <div className="w-full h-full bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                                  {file.file?.type?.startsWith('image/') || file.type?.startsWith('image/') ? (
                                    <img 
                                      src={file.preview || (file instanceof File ? URL.createObjectURL(file) : '')} 
                                      alt="preview" 
                                      className="w-full h-full object-cover cursor-zoom-in" 
                                      onClick={() => setPreviewFile(file)}
                                      referrerPolicy="no-referrer" 
                                    />
                                  ) : (
                                    <FileText className="w-6 h-6 text-slate-400" />
                                  )}
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDeviceFile(editingRowId, idx);
                                  }}
                                  className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Global File Pool Preview */}
                    <section>
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-800">關聯全局文件池 (共享)</h3>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { id: 'electricity', label: '電費單據', count: globalFiles.electricity.length, color: 'bg-blue-50 text-blue-600' },
                          { id: 'efficiency', label: '新設備能源標籤', count: globalFiles.efficiency.length, color: 'bg-amber-50 text-amber-600' },
                          { id: 'oldEfficiency', label: '舊設備能源標籤', count: globalFiles.oldEfficiency.length, color: 'bg-emerald-50 text-emerald-600' },
                          { id: 'financial', label: '財務證明', count: globalFiles.financial.length, color: 'bg-purple-50 text-purple-600' }
                        ].map((type, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setViewingCategory(type.id)}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-white transition-all cursor-pointer group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-700">{type.label}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                                {type.count} FILES
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={() => {
                    if (viewingCategory) {
                      setViewingCategory(null);
                    } else {
                      setDrawerOpen(false);
                    }
                  }}
                  className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                >
                  <span>{viewingCategory ? '返回列表' : '確認並關閉'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen File Preview */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
              onClick={() => setPreviewFile(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
            >
              {(() => {
                const fileUrl = previewFile.preview || (previewFile instanceof File ? URL.createObjectURL(previewFile) : (previewFile.file ? URL.createObjectURL(previewFile.file) : ''));
                const isPDF = (previewFile.type === 'application/pdf') || (previewFile.file?.type === 'application/pdf') || (previewFile instanceof File && previewFile.type === 'application/pdf');
                
                if (isPDF) {
                  return (
                    <div className="w-full h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      <div className="flex-1 relative bg-slate-50">
                        <object 
                          data={`${fileUrl}#toolbar=0&navpanes=0`} 
                          type="application/pdf" 
                          className="w-full h-full border-none"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                              <FileText className="w-10 h-10 text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">PDF 預覽受限</h3>
                            <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
                              由於瀏覽器安全限制，PDF 內容在當前窗口中被屏蔽。請點擊下方按鈕在新分頁中查看。
                            </p>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center space-x-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>在新分頁中打開 PDF</span>
                            </a>
                          </div>
                        </object>
                      </div>
                      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF 文件預覽</span>
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors flex items-center space-x-1.5 uppercase tracking-wider"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>在新分頁打開</span>
                        </a>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <img 
                    src={fileUrl} 
                    alt="preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
              <button 
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-amber-400 transition-colors flex items-center space-x-2"
              >
                <span className="text-sm font-bold uppercase tracking-widest">關閉預覽</span>
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default DataVerificationCLP;

