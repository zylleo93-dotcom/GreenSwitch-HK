import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: 2, borderBottomColor: '#B45309', paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#B45309', marginBottom: 10 },
  subtitle: { fontSize: 12, color: '#6B7280' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 10, backgroundColor: '#FFFBEB', padding: 8 },
  metric: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 10, color: '#6B7280' },
  metricValue: { fontSize: 10, fontWeight: 'bold', color: '#1E293B' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: 1, borderTopColor: '#E5E7EB', paddingTop: 10 },
  disclaimer: { fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
});

const PDFReportCLP = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>中電 (CLP) 節能效益分析報告</Text>
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
          <Text style={styles.metricLabel}>投資回報周期</Text>
          <Text style={styles.metricValue}>{data.paybackPeriod.toFixed(1)} 個月</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>資助上限提示</Text>
          <Text style={styles.metricValue}>{data.estimatedSubsidy >= 10000 ? '已達單次申報上限 $10,000' : '未達上限'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          本報告僅供參考，最終資助額以中電 (CLP) 官方審批結果為準。
        </Text>
      </View>
    </Page>
  </Document>
);

const PDFReportGeneratorCLP = ({ data }) => (
  <PDFDownloadLink
    document={<PDFReportCLP data={data} />}
    fileName={`GreenSwitch_CLP_Report_${new Date().getTime()}.pdf`}
    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
  >
    <Download className="w-5 h-5" />
    <span>下載中电 (CLP) 節能效益分析報告（PDF）</span>
  </PDFDownloadLink>
);

export default PDFReportGeneratorCLP;
