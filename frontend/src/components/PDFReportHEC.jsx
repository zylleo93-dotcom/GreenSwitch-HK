import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: 2, borderBottomColor: '#4A4E3D', paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4A4E3D', marginBottom: 10 },
  subtitle: { fontSize: 12, color: '#6B7280' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10, backgroundColor: '#F0EFEB', padding: 8 },
  metric: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 10, color: '#6B7280' },
  metricValue: { fontSize: 10, fontWeight: 'bold', color: '#1E293B' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: 1, borderTopColor: '#E5E7EB', paddingTop: 10 },
  disclaimer: { fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
});

const PDFReportHEC = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>港燈 (HEC) 節能效益分析報告</Text>
        <Text style={styles.subtitle}>GreenSwitch HK 專業分析 | 生成日期：{new Date().toLocaleDateString('zh-HK')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 申請概覽</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>行業類型</Text>
          <Text style={styles.metricValue}>{data.industry}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>設備總數</Text>
          <Text style={styles.metricValue}>{data.itemCount} 項</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 節能效益預估</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>預計年節省電費</Text>
          <Text style={styles.metricValue}>HK${Math.round(data.annualSavings).toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>預計年節電量</Text>
          <Text style={styles.metricValue}>{Math.round(data.annualSavingsKWh).toLocaleString()} kWh</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>預計年減碳量</Text>
          <Text style={styles.metricValue}>{data.carbonReduction.toFixed(2)} 噸 CO2e</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 資助與財務分析</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>預計獲批資助額</Text>
          <Text style={styles.metricValue}>HK${Math.round(data.estimatedSubsidy).toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>資助比例</Text>
          <Text style={styles.metricValue}>{(data.subsidyRate * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>投資回報周期</Text>
          <Text style={styles.metricValue}>{data.paybackPeriod.toFixed(1)} 個月</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>能源審核狀態</Text>
          <Text style={styles.metricValue}>{data.hasEnergyAudit ? '已完成 (資助比例最高 80%)' : '未完成 (資助比例約 50%)'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          本報告僅供參考，最終資助額以港燈 (HEC) 官方審批結果為準。
        </Text>
      </View>
    </Page>
  </Document>
);

const PDFReportGeneratorHEC = ({ data }) => (
  <PDFDownloadLink
    document={<PDFReportHEC data={data} />}
    fileName={`GreenSwitch_HEC_Report_${new Date().getTime()}.pdf`}
    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#059669] text-white rounded-xl hover:bg-[#047857] transition-all shadow-lg shadow-slate-200"
  >
    <Download className="w-5 h-5" />
    <span>下載港燈 (HEC) 節能效益分析報告（PDF）</span>
  </PDFDownloadLink>
);

export default PDFReportGeneratorHEC;
