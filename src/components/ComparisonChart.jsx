import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ComparisonChart = ({ data }) => {
  const barData = [
    {
      name: '舊設備',
      年用電量: data.oldAnnualUsage,
      年電費: data.oldAnnualCost,
      年碳排放: data.oldCarbon,
    },
    {
      name: '新設備',
      年用電量: data.newAnnualUsage,
      年電費: data.newAnnualCost,
      年碳排放: data.newCarbon,
    },
  ];

  const pieData = [
    { name: '節省電費', value: data.annualSavings, color: '#10B981' },
    { name: '設備成本', value: data.equipmentCost, color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">年度用電量對比</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value.toLocaleString()} kWh`, '用電量']} />
            <Bar dataKey="年用電量" fill="#0F172A" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">成本分析</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center space-x-4 mt-4">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
