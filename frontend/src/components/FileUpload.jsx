import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, X, Image as ImageIcon, Plus } from 'lucide-react';

const FileUpload = ({ 
  onFileUpload, 
  title, 
  description, 
  icon: Icon, 
  multiple = false, 
  maxFiles = 1,
  colorClass = 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50',
  activeClass = 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10 scale-[1.02]'
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState({});

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newFiles = multiple ? [...files, ...acceptedFiles] : [acceptedFiles[0]];
        
        // Limit number of files if needed (though maxFiles in dropzone handles the drop event, we handle state)
        const finalFiles = multiple && maxFiles ? newFiles.slice(0, maxFiles) : newFiles;
        
        setFiles(finalFiles);
        onFileUpload(multiple ? finalFiles : finalFiles[0]);

        // Create previews for images
        const newPreviews = { ...previews };
        acceptedFiles.forEach(file => {
          if (file.type.startsWith('image/')) {
            newPreviews[file.name] = URL.createObjectURL(file);
          }
        });
        setPreviews(newPreviews);
      }
    },
    [onFileUpload, files, multiple, maxFiles, previews]
  );

  const removeFile = (e, fileToRemove) => {
    e.stopPropagation();
    const newFiles = files.filter(f => f !== fileToRemove);
    setFiles(newFiles);
    
    // Cleanup preview
    if (previews[fileToRemove.name]) {
      URL.revokeObjectURL(previews[fileToRemove.name]);
      const newPreviews = { ...previews };
      delete newPreviews[fileToRemove.name];
      setPreviews(newPreviews);
    }

    onFileUpload(multiple ? newFiles : (newFiles[0] || null));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    multiple,
    maxFiles: multiple ? (maxFiles || 0) : 1,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group min-h-[200px] flex flex-col items-center justify-center ${
          isDragActive 
            ? activeClass 
            : files.length > 0
              ? 'border-emerald-400 bg-emerald-50/30' 
              : colorClass
        }`}
      >
        <input {...getInputProps()} />
        
        {files.length === 0 ? (
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDragActive ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              <Icon className={`w-8 h-8 transition-colors duration-300 ${
                isDragActive ? 'text-emerald-600' : 'text-slate-600'
              }`} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-gray-500 max-w-[200px] mx-auto">
                {description}
              </p>
            </div>
            <div className={`flex items-center space-x-2 transition-all duration-300 ${
              isDragActive ? 'text-emerald-600 scale-110' : 'text-slate-500'
            }`}>
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isDragActive ? '放開以上傳' : '點擊或拖曳檔案'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-emerald-900 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                已選擇 {files.length} 個檔案
              </h3>
              <button 
                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center"
                onClick={(e) => { e.stopPropagation(); /* Trigger dropzone open */ }}
              >
                <Plus className="w-3 h-3 mr-1" />
                添加更多
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative group/item bg-white p-2 rounded-lg border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={(e) => removeFile(e, file)}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors z-10 opacity-0 group-hover/item:opacity-100"
                    title="移除檔案"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  
                  <div className="aspect-square rounded-md overflow-hidden bg-slate-50 mb-2 flex items-center justify-center relative">
                    {previews[file.name] ? (
                      <img src={previews[file.name]} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        {file.type === 'application/pdf' ? (
                          <FileText className="w-8 h-8 mb-1" />
                        ) : (
                          <ImageIcon className="w-8 h-8 mb-1" />
                        )}
                        <span className="text-[10px] uppercase">{file.name.split('.').pop()}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-700 truncate font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
