import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const ResultCard = ({ title, value, unit, icon: Icon, color, delay = 0, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {subtitle && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase tracking-wider">
            {subtitle}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-slate-900">
            <CountUp
              end={value}
              duration={2}
              decimals={value % 1 !== 0 ? 2 : 0}
              prefix={unit === 'HKD' ? '$' : ''}
              suffix={unit !== 'HKD' ? ` ${unit}` : ''}
            />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
