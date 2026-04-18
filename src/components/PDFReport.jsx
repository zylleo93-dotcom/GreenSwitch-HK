import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

Font.register({
  family: 'NotoSansSC',
  src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansSC',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#0F172A',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
    backgroundColor: '#F1F5F9',
    padding: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 12,
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
    fontWeight: 'bold',
  },
  metric: {
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  disclaimer: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

const PDFReport = ({ data }) => {
  const reportData = {
    date: new Date().toLocaleDateString('zh-HK'),
    industry: data.industry,
    oldPower: data.oldPower,
    newPower: data.newPower,
    annualSavings: data.annualSavings,
    carbonReduction: data.carbonReduction,
    paybackPeriod: data.paybackPeriod,
    eligibleForSubsidy: data.eligibleForSubsidy,
  };

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>環境效益測算與綠色融資資質評估報告</Text>
          <Text style={styles.subtitle}>GreenSwitch HK 專業分析報告</Text>
          <Text style={styles.subtitle}>生成日期：{reportData.date}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>執行摘要</Text>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>客戶行業</Text>
            <Text style={styles.metricValue}>{reportData.industry}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>預計年節省電費</Text>
            <Text style={styles.metricValue}>HK${reportData.annualSavings.toLocaleString()}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>預計年減碳量</Text>
            <Text style={styles.metricValue}>{reportData.carbonReduction.toFixed(2)} 噸 CO2e</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設備技術參數</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableHeader, { width: '50%' }]}>項目</Text>
              <Text style={[styles.tableCell, styles.tableHeader, { width: '25%' }]}>舊設備</Text>
              <Text style={[styles.tableCell, styles.tableHeader, { width: '25%' }]}>新設備</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '50%' }]}>功率 (kW)</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{reportData.oldPower}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{reportData.newPower}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>財務分析</Text>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>投資回報周期</Text>
            <Text style={styles.metricValue}>{reportData.paybackPeriod} 個月</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>補貼資格</Text>
            <Text style={styles.metricValue}>
              {reportData.eligibleForSubsidy ? '符合中電節能設備資助申請資格' : '暫不符合補貼資格'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            免責聲明：本報告基於用戶提供的資料和AI分析結果生成，僅供參考。實際節能效果可能因使用環境、設備狀態等因素而異。
            建議在做出投資決策前諮詢專業人士意見。
          </Text>
        </View>
      </Page>
    </Document>
  );
};

const PDFReportGenerator = ({ data }) => {
  return (
    <PDFDownloadLink
      document={<PDFReport data={data} />}
      fileName={`GreenSwitch_Report_${new Date().toISOString().split('T')[0]}.pdf`}
      className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-300"
    >
      <Download className="w-5 h-5" />
      <span>下載正式評估報告 (PDF)</span>
    </PDFDownloadLink>
  );
};

export default PDFReportGenerator;
