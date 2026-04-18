import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, FileSearch } from 'lucide-react';

const LoadingAnalysis = () => {
  const steps = [
    { icon: FileSearch, text: '正在掃描電費單條碼...', delay: 0 },
    { icon: Brain, text: 'AI 識別能效標籤等級...', delay: 0.5 },
    { icon: Zap, text: '計算節能設備資助數據...', delay: 1 },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-8 h-8 text-emerald-600" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-6">AI 正在分析您的資料</h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center space-x-3"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
              />
              <Icon className="w-5 h-5 text-slate-600" />
              <span className="text-slate-700">{step.text}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 text-sm text-gray-500"
      >
        預計分析時間：2-3秒
      </motion.div>
    </div>
  );
};

export default LoadingAnalysis;
