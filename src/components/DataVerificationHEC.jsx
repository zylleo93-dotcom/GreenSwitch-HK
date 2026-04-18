import React, { useMemo, useState, useRef } from 'react';
import { CheckCircle, Zap, Plus, Trash2, ChevronRight, X, Upload, FileText, Camera, DollarSign, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './FileUpload.jsx';
import { analyzeImages } from '../utils/aiService.js';

const DataVerificationHEC = ({ data, onDataChange, onConfirm, globalFiles, onGlobalFileUpload, onGlobalFileDelete }) => {
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

  const items = data.items || [];
  const defaultAnnualHours = data.step1OperatingHours ? data.step1OperatingHours * 365 : 2500;

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
        'HEC',
        data.installationType || 'replacement'
      );

      if (isSingleRow && editingRowId) {
        // Update ONLY the specific row
        const result = results[0]; // Take the first result for single row
        const sanitizedResult = Object.fromEntries(
          Object.entries(result).map(([k, v]) => [k, v ?? (initialItemState[k] ?? '')])
        );
        const newItems = items.map(item => {
          if (item.id === editingRowId) {
            return {
              ...item,
              ...sanitizedResult,
              isAiGenerated: true
            };
          }
          return item;
        });
        onDataChange({ ...data, items: newItems });
        setDrawerOpen(false);
      } else {
        // Full analysis
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

  const initialItemState = {
    deviceType: 'AC_GRADE1',
    brand: '',
    model: '',
    installLocation: '',
    quantity: 1,
    operatingHours: defaultAnnualHours,
    
    // Old specs
    oldBrand: '',
    oldModel: '',
    oldRatedPower: 0,
    oldCoolingCapacity: 0,
    oldDiameter: '',
    oldLength: '',
    oldOperatingHours: defaultAnnualHours,
    oldInstallLocation: '',
    
    // New specs
    ratedPower: 0,
    coolingCapacity: 0,
    diameter: '',
    length: '',
    
    // Financial
    purchaseDate: new Date().toISOString().split('T')[0],
    equipmentCost: 0,
    electricityPrice: 0,
    otherSubsidy: 0,
  };

  // Group items by projectId
  const sortedGroups = useMemo(() => {
    const currentItems = data.items || [];
    const projectMap = new Map();

    currentItems.forEach(item => {
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
  }, [data.items]);

  const handleAddProject = () => {
    const newProjectId = `proj_${Date.now()}`;
    const newItem = {
      ...initialItemState,
      id: Date.now(),
      projectId: newProjectId,
      isNewInstallation: false, // HEC defaults to Replacement
    };
    onDataChange({ ...data, items: [...items, newItem] });
  };

  const handleAddRow = (projectId, isNewInstallation) => {
    const newItem = {
      ...initialItemState,
      id: Date.now(),
      projectId: projectId,
      isNewInstallation: isNewInstallation,
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
  };

  const validateData = () => {
    const errors = {};
    const itemsToValidate = data.items || [];
    
    if (itemsToValidate.length === 0) return false;

    itemsToValidate.forEach(item => {
      const rowErrors = [];
      
      // Common fields
      if (!item.brand) rowErrors.push('brand');
      if (!item.model) rowErrors.push('model');
      if (!item.installLocation) rowErrors.push('installLocation');
      if (!item.quantity || item.quantity <= 0) rowErrors.push('quantity');
      if (!item.operatingHours || item.operatingHours <= 0) rowErrors.push('operatingHours');
      if (!item.ratedPower || item.ratedPower <= 0) rowErrors.push('ratedPower');
      
      // Old specs (if not new installation)
      if (!item.isNewInstallation) {
        if (!item.oldBrand) rowErrors.push('oldBrand');
        if (!item.oldModel) rowErrors.push('oldModel');
        if (!item.oldRatedPower || item.oldRatedPower <= 0) rowErrors.push('oldRatedPower');
      }

      // Financial
      if (!item.equipmentCost || item.equipmentCost <= 0) rowErrors.push('equipmentCost');
      if (!item.purchaseDate) rowErrors.push('purchaseDate');

      if (rowErrors.length > 0) {
        errors[item.id] = rowErrors;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateData()) {
      onConfirm();
    }
  };

  const getFieldClass = (id, field) => {
    const isError = validationErrors[id]?.includes(field);
    return `${inputClass} ${isError ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : ''}`;
  };

  const TableHeader = ({ title, subtitle }) => (
    <div className="bg-[#ECFDF5] text-emerald-900 p-3 flex justify-between items-center border-b border-emerald-200">
      <h4 className="text-sm font-bold tracking-wider">{title}</h4>
      {subtitle && <span className="text-[10px] text-emerald-700 font-semibold">{subtitle}</span>}
    </div>
  );

  const LocationInput = ({ value, onChange, className }) => {
    const commonLocations = ['辦公室', '會議室', '走廊', '大堂', '儲物室'];
    const isOther = value !== '' && !commonLocations.includes(value);

    return (
      <div className="flex flex-col space-y-1">
        <select 
          className={className}
          value={isOther ? '其他' : (commonLocations.includes(value) ? value : '')}
          onChange={(e) => {
            if (e.target.value === '其他') {
              onChange(' ');
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

  const tableHeaderClass = "border border-emerald-200 p-2 text-center font-bold text-emerald-900 bg-[#ECFDF5]";
  const tableCellClass = "border border-emerald-200 p-2";
  const inputClass = "w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

  const renderOldTable = () => {
    const oldGroups = sortedGroups.filter(g => !g.isNewInstallation);
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <TableHeader title="更換節能設備 (原有裝置)" subtitle="(如有需要請複印)" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th rowSpan="2" className={tableHeaderClass}>項目編號</th>
                <th rowSpan="2" className={tableHeaderClass}>設備</th>
                <th rowSpan="2" className={tableHeaderClass}>型號及品牌</th>
                <th className={tableHeaderClass}>空調</th>
                <th colSpan="2" className={tableHeaderClass}>燈具</th>
                <th rowSpan="2" className={tableHeaderClass}>額定功率 (瓦)</th>
                <th rowSpan="2" className={tableHeaderClass}>數量</th>
                <th rowSpan="2" className={tableHeaderClass}>安裝位置</th>
                <th rowSpan="2" className={tableHeaderClass}>每年使用時數</th>
                <th rowSpan="2" className={tableHeaderClass}>資料核對 / 管理</th>
              </tr>
              <tr>
                <th className={tableHeaderClass}>製冷量 (千瓦)</th>
                <th className={tableHeaderClass}>直徑 (T5/T8)</th>
                <th className={tableHeaderClass}>長度 (毫米)</th>
              </tr>
            </thead>
            <tbody>
              {oldGroups.map((group) => (
                <React.Fragment key={`old-${group.projectId}`}>
                  {group.rows.map((item) => {
                    const fileCount = (deviceFiles[item.id]?.length || 0) + 
                                     (Object.values(globalFiles).flat().length);
                    return (
                      <tr key={`old-row-${item.id}`} className={`hover:bg-slate-50 transition-colors border-b border-emerald-100 ${item.isAiGenerated ? 'bg-emerald-50/5' : ''}`}>
                        <td className={tableCellClass}>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-emerald-800">{group.displayNo}</span>
                            {item.isAiGenerated && (
                              <div className="flex items-center bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" title="AI 自動生成">
                                <Zap className="w-2.5 h-2.5 mr-0.5 fill-emerald-500" />
                                AI
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          <select className={inputClass} value={item.deviceType} onChange={(e) => handleItemChange(item.id, 'deviceType', e.target.value)}>
                            <option value="LED_BULB">LED 燈膽 / 筒燈</option>
                            <option value="LED_TUBE">LED 光管 / 燈帶 / 燈盤</option>
                            <option value="AC_GRADE1">一級能源標籤冷氣機</option>
                            <option value="AC_SYSTEM">高能源效益冷氣設備</option>
                            <option value="HEAT_RECOVERY">熱能回收系統</option>
                            <option value="OTHER">其他節能設備</option>
                          </select>
                        </td>
                        <td className={tableCellClass}>
                          <div className="flex flex-col space-y-1">
                            <input placeholder="品牌" className={getFieldClass(item.id, 'oldBrand')} value={item.oldBrand} onChange={(e) => handleItemChange(item.id, 'oldBrand', e.target.value)} />
                            <input placeholder="型號" className={getFieldClass(item.id, 'oldModel')} value={item.oldModel} onChange={(e) => handleItemChange(item.id, 'oldModel', e.target.value)} />
                          </div>
                        </td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldCoolingCapacity')} value={item.oldCoolingCapacity} onChange={(e) => handleItemChange(item.id, 'oldCoolingCapacity', Number(e.target.value))} disabled={!item.deviceType.startsWith('AC')} /></td>
                        <td className={tableCellClass}><input type="text" className={getFieldClass(item.id, 'oldDiameter')} value={item.oldDiameter} onChange={(e) => handleItemChange(item.id, 'oldDiameter', e.target.value)} disabled={!item.deviceType.startsWith('LED')} /></td>
                        <td className={tableCellClass}><input type="text" className={getFieldClass(item.id, 'oldLength')} value={item.oldLength} onChange={(e) => handleItemChange(item.id, 'oldLength', e.target.value)} disabled={!item.deviceType.startsWith('LED')} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldRatedPower')} value={item.oldRatedPower ?? ''} onChange={(e) => handleItemChange(item.id, 'oldRatedPower', Number(e.target.value))} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity ?? ''} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                        <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'oldInstallLocation')} value={item.oldInstallLocation ?? ''} onChange={(val) => handleItemChange(item.id, 'oldInstallLocation', val)} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'oldOperatingHours')} value={item.oldOperatingHours ?? ''} onChange={(e) => handleItemChange(item.id, 'oldOperatingHours', Number(e.target.value))} /></td>
                        <td className={`${tableCellClass} text-center`}>
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenDrawer(item.id)}
                              className={`p-1.5 rounded transition-all flex items-center space-x-1.5 border ${
                                (deviceFiles[item.id]?.length || 0) > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                              }`}
                              title="查看文件與核對資料"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">核對資料</span>
                              {fileCount > 0 && (
                                <span className="bg-emerald-500 text-white text-[9px] px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
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
                    <td colSpan={100} className="px-3 py-2 text-center border border-emerald-200">
                      <button onClick={() => handleAddRow(group.projectId, false)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center w-full">
                        <Plus className="w-3 h-3 mr-1" /> 增加行 (項目 {group.displayNo})
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNewTable = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <TableHeader title="更換節能設備 (新裝裝置#)" subtitle="(如有需要請複印)" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th rowSpan="2" className={tableHeaderClass}>項目編號</th>
                <th rowSpan="2" className={tableHeaderClass}>更換或新添置</th>
                <th rowSpan="2" className={tableHeaderClass}>設備</th>
                <th rowSpan="2" className={tableHeaderClass}>型號及品牌</th>
                <th className={tableHeaderClass}>空調</th>
                <th colSpan="2" className={tableHeaderClass}>燈具</th>
                <th rowSpan="2" className={tableHeaderClass}>額定功率 (瓦)</th>
                <th rowSpan="2" className={tableHeaderClass}>數量</th>
                <th rowSpan="2" className={tableHeaderClass}>安裝位置</th>
                <th rowSpan="2" className={tableHeaderClass}>每年使用時數</th>
                <th rowSpan="2" className={tableHeaderClass}>資料核對 / 管理</th>
              </tr>
              <tr>
                <th className={tableHeaderClass}>製冷量 (千瓦)</th>
                <th className={tableHeaderClass}>直徑 (T5/T8)</th>
                <th className={tableHeaderClass}>長度 (毫米)</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => (
                <React.Fragment key={`new-${group.projectId}`}>
                  {group.rows.map((item, idx) => {
                    const fileCount = (deviceFiles[item.id]?.length || 0) + 
                                     (Object.values(globalFiles).flat().length);
                    return (
                      <tr key={`new-row-${item.id}`} className={`hover:bg-slate-50 transition-colors border-b border-emerald-100 ${item.isAiGenerated ? 'bg-emerald-50/5' : ''}`}>
                        <td className={tableCellClass}>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-emerald-800">{group.displayNo}</span>
                            {item.isAiGenerated && (
                              <div className="flex items-center bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" title="AI 自動生成">
                                <Zap className="w-2.5 h-2.5 mr-0.5 fill-emerald-500" />
                                AI
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          {idx === 0 ? (
                            <select className={getFieldClass(item.id, 'isNewInstallation')} value={group.isNewInstallation ? 'new' : 'replacement'} onChange={(e) => handleProjectTypeChange(group.projectId, e.target.value === 'new')}>
                              <option value="replacement">更換</option>
                              <option value="new">新添置</option>
                            </select>
                          ) : (
                            <div className="text-xs text-slate-500 text-center">{group.isNewInstallation ? '新添置' : '更換'}</div>
                          )}
                        </td>
                        <td className={tableCellClass}>
                          <select className={getFieldClass(item.id, 'deviceType')} value={item.deviceType} onChange={(e) => handleItemChange(item.id, 'deviceType', e.target.value)}>
                            <option value="LED_BULB">LED 燈膽 / 筒燈</option>
                            <option value="LED_TUBE">LED 光管 / 燈帶 / 燈盤</option>
                            <option value="AC_GRADE1">一級能源標籤冷氣機</option>
                            <option value="AC_SYSTEM">高能源效益冷氣設備</option>
                            <option value="HEAT_RECOVERY">熱能回收系統</option>
                            <option value="OTHER">其他節能設備</option>
                          </select>
                        </td>
                        <td className={tableCellClass}>
                          <div className="flex flex-col space-y-1">
                            <input placeholder="品牌" className={getFieldClass(item.id, 'brand')} value={item.brand} onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} />
                            <input placeholder="型號" className={getFieldClass(item.id, 'model')} value={item.model} onChange={(e) => handleItemChange(item.id, 'model', e.target.value)} />
                          </div>
                        </td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'coolingCapacity')} value={item.coolingCapacity} onChange={(e) => handleItemChange(item.id, 'coolingCapacity', Number(e.target.value))} disabled={!item.deviceType.startsWith('AC')} /></td>
                        <td className={tableCellClass}><input type="text" className={getFieldClass(item.id, 'diameter')} value={item.diameter} onChange={(e) => handleItemChange(item.id, 'diameter', e.target.value)} disabled={!item.deviceType.startsWith('LED')} /></td>
                        <td className={tableCellClass}><input type="text" className={getFieldClass(item.id, 'length')} value={item.length} onChange={(e) => handleItemChange(item.id, 'length', e.target.value)} disabled={!item.deviceType.startsWith('LED')} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'ratedPower')} value={item.ratedPower} onChange={(e) => handleItemChange(item.id, 'ratedPower', Number(e.target.value))} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'quantity')} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} /></td>
                        <td className={tableCellClass}><LocationInput className={getFieldClass(item.id, 'installLocation')} value={item.installLocation} onChange={(val) => handleItemChange(item.id, 'installLocation', val)} /></td>
                        <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'operatingHours')} value={item.operatingHours} onChange={(e) => handleItemChange(item.id, 'operatingHours', Number(e.target.value))} /></td>
                        <td className={`${tableCellClass} text-center`}>
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenDrawer(item.id)}
                              className={`p-1.5 rounded transition-all flex items-center space-x-1.5 border ${
                                (deviceFiles[item.id]?.length || 0) > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                              }`}
                              title="查看文件與核對資料"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">核對資料</span>
                              {fileCount > 0 && (
                                <span className="bg-emerald-500 text-white text-[9px] px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
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
                    <td colSpan={100} className="px-3 py-2 text-center border border-emerald-200">
                      <button onClick={() => handleAddRow(group.projectId, group.isNewInstallation)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center w-full">
                        <Plus className="w-3 h-3 mr-1" /> 增加行 (項目 {group.displayNo})
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentTable = () => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <TableHeader title="付款資料" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>項目編號</th>
                <th className={tableHeaderClass}>付款日期 (DD/MM/YYYY)</th>
                <th className={tableHeaderClass}>項目費用總額 (港幣) (A)</th>
                <th className={tableHeaderClass}>其他基金/資助 (港幣) (B)</th>
                <th className={tableHeaderClass}>合資格項目費用淨額 (港幣) (A)-(B)=(C)</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroups.map((group) => (
                <React.Fragment key={`payment-${group.projectId}`}>
                  {group.rows.map((item) => (
                    <tr key={`payment-row-${item.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className={`${tableCellClass} text-center font-bold`}>{group.displayNo}</td>
                      <td className={tableCellClass}><input type="date" className={getFieldClass(item.id, 'purchaseDate')} value={item.purchaseDate ?? ''} onChange={(e) => handleItemChange(item.id, 'purchaseDate', e.target.value)} /></td>
                      <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'equipmentCost')} value={item.equipmentCost ?? ''} onChange={(e) => handleItemChange(item.id, 'equipmentCost', Number(e.target.value))} /></td>
                      <td className={tableCellClass}><input type="number" className={getFieldClass(item.id, 'otherSubsidy')} value={item.otherSubsidy ?? ''} onChange={(e) => handleItemChange(item.id, 'otherSubsidy', Number(e.target.value))} /></td>
                      <td className={`${tableCellClass} text-right font-bold text-emerald-700`}>HKD {(item.equipmentCost - item.otherSubsidy).toLocaleString()}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 relative">
      {/* Global Upload Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h4 className="text-lg font-bold text-slate-900 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-emerald-600" />
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
            colorClass="border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
            activeClass="border-emerald-500 bg-emerald-50"
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
            colorClass="border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
            activeClass="border-emerald-500 bg-emerald-50"
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
            colorClass="border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
            activeClass="border-emerald-500 bg-emerald-50"
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
            colorClass="border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50"
            activeClass="border-emerald-500 bg-emerald-50"
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
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20'
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
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-emerald-500" />
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
                  className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  確認分析
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 能源審核狀態 */}
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">能源審核狀態</h4>
            <p className="text-sm text-slate-600">已完成港燈「智惜用電能源審核」可享 80% 資助比率（預設為 60%）</p>
          </div>
        </div>
        <button
          onClick={() => onDataChange({ ...data, hasEnergyAudit: !data.hasEnergyAudit })}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
            data.hasEnergyAudit 
              ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
              : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
          }`}
        >
          {data.hasEnergyAudit ? '已完成審核 (80%)' : '尚未完成 (60%)'}
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">港燈 (HEC) 申報數據確認</h3>
            <p className="text-xs text-slate-500">請核對以下表格數據，確保與官方申請表一致</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleAddProject} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold flex items-center hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> 新增項目
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-4">
          {renderOldTable()}
          {renderNewTable()}
          {renderPaymentTable()}
          
          <p className="text-[10px] text-slate-400 italic">註：#如項目涉及安裝熱能回收系統，請提供預期年度節能效果的計算表並附上相關文件，包括但不限於相關設備目錄、系統配置、技術及操作資料。</p>
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
            onClick={handleNext} 
            disabled={items.length === 0} 
            className={`px-12 py-4 rounded-xl font-bold transition-all flex items-center justify-center space-x-3 ${
              items.length === 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
            }`}
          >
            <span className="text-lg">生成Excel表格和节能效益分析報告</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setDrawerOpen(false); setViewingCategory(null); }} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
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
                    {!viewingCategory && (
                      <div className="flex items-center bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
                        <Zap className="w-3 h-3 mr-1 fill-emerald-500" />
                        AI 生成
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {viewingCategory ? '查看與管理已上傳的文件' : `項目編號: ${items.find(i => i.id === editingRowId)?.projectId || '---'}`}
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
                        className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
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
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                          <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 group-hover:text-emerald-600">上傳文件</span>
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
                    {/* Current Device Files */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                          <h3 className="text-sm font-black text-slate-800">當前設備文件 (專屬)</h3>
                        </div>
                        <button 
                          onClick={() => handleRunAI(true)}
                          disabled={isAnalyzing || (!hasChanges && (!deviceFiles[editingRowId] || deviceFiles[editingRowId].length === 0))}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          <span>僅重新分析此行</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                        您可以重新上傳此設備的專屬文件（如銘牌照片）以進行單獨分析，或者直接在表格中手動修改數據。
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {deviceFiles[editingRowId]?.map((file, idx) => (
                          <div key={idx} className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <img 
                              src={file.preview} 
                              alt="preview" 
                              className="w-full h-full object-cover cursor-zoom-in" 
                              onClick={() => setPreviewFile(file)}
                              referrerPolicy="no-referrer" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => handleRemoveDeviceFile(editingRowId, idx)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
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
                          { id: 'efficiency', label: '新設備能源標籤', count: globalFiles.efficiency.length, color: 'bg-emerald-50 text-emerald-600' },
                          { id: 'oldEfficiency', label: '舊設備能源標籤', count: globalFiles.oldEfficiency.length, color: 'bg-amber-50 text-amber-600' },
                          { id: 'financial', label: '財務證明', count: globalFiles.financial.length, color: 'bg-purple-50 text-purple-600' }
                        ].map((type, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setViewingCategory(type.id)}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-white transition-all cursor-pointer group"
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
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
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
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
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
                className="absolute -top-12 right-0 p-2 text-white hover:text-emerald-400 transition-colors flex items-center space-x-2"
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

export default DataVerificationHEC;
