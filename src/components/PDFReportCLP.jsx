import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { Download } from 'lucide-react';

Font.register({
  family: 'NotoSansSC',
  src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'NotoSansSC', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 30, borderBottomWidth: 3, borderBottomColor: '#B45309', paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B45309', marginBottom: 5 },
  subtitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  
  summaryBox: { backgroundColor: '#FFFBEB', padding: 20, borderRadius: 10, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 9, color: '#92400e', marginBottom: 5, fontWeight: 'bold' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#B45309' },
  
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#B45309', paddingLeft: 10 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  card: { width: '47%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: '#f1f5f9' },
  cardLabel: { fontSize: 9, color: '#64748b', marginBottom: 4 },
  cardValue: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  
  impactBox: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 10, marginTop: 10, borderWidth: 1, borderStyle: 'solid', borderColor: '#dcfce7' },
  impactTitle: { fontSize: 11, fontWeight: 'bold', color: '#166534', marginBottom: 8 },
  impactText: { fontSize: 10, color: '#15803d', lineHeight: 1.5 },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
  disclaimer: { fontSize: 7, color: '#cbd5e1', textAlign: 'center', marginTop: 5 },
});

const PDFReportCLP = ({ data }) => {
  const trees = Math.round(data.carbonReduction * 45);
  const carKm = Math.round(data.carbonReduction * 5000);

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>中電 (CLP) 節能效益分析報告</Text>
          <Text style={styles.subtitle}>GreenSwitch HK | 項目編號: GS-{new Date().getTime().toString().slice(-6)}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>預計總補貼金額</Text>
            <Text style={styles.summaryValue}>HK$ {Math.round(data.estimatedSubsidy).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>年度節省電費</Text>
            <Text style={styles.summaryValue}>HK$ {Math.round(data.annualSavings).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>核心效益指標</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>預計年節電量</Text>
              <Text style={styles.cardValue}>{Math.round(data.annualSavingsKWh).toLocaleString()} kWh</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>投資回報周期</Text>
              <Text style={styles.cardValue}>{data.paybackPeriod.toFixed(1)} 個月</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>年減碳量</Text>
              <Text style={styles.cardValue}>{data.carbonReduction.toFixed(2)} 噸 CO2e</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>設備總數</Text>
              <Text style={styles.cardValue}>{data.itemCount} 項</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>環境影響評估</Text>
          <View style={styles.impactBox}>
            <Text style={styles.impactTitle}>您的節能行動相當於：</Text>
            <Text style={styles.impactText}>• 每年為地球種植了約 {trees} 棵成年樹木</Text>
            <Text style={styles.impactText}>• 減少了私家車行駛約 {carKm.toLocaleString()} 公里的碳排放</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>後續申請建議</Text>
          <View style={{ paddingLeft: 10 }}>
            <Text style={{ fontSize: 9, color: '#475569', marginBottom: 5 }}>1. 下載並填寫中電「節能設備資助計劃」申請表格</Text>
            <Text style={{ fontSize: 9, color: '#475569', marginBottom: 5 }}>2. 準備設備發票、收據及新舊設備對比照片</Text>
            <Text style={{ fontSize: 9, color: '#475569', marginBottom: 5 }}>3. 確保在購買設備後規定期限內提交申請</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>報告生成日期: {new Date().toLocaleDateString('zh-HK')}</Text>
          <Text style={styles.footerText}>GreenSwitch HK 專業分析</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 15, left: 40, right: 40 }}>
          <Text style={styles.disclaimer}>本報告僅供參考，最終資助額以中電 (CLP) 官方審批結果為準。</Text>
        </View>
      </Page>
    </Document>
  );
};

const PDFReportGeneratorCLP = ({ data }) => (
  <PDFDownloadLink
    document={<PDFReportCLP data={data} />}
    fileName={`GreenSwitch_CLP_Report_${new Date().getTime()}.pdf`}
    className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 cursor-pointer min-w-[240px]"
  >
    {({ loading }) => (
      <>
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>正在生成報告...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>下載中電 (CLP) 節能效益分析報告 (PDF)</span>
          </div>
        )}
      </>
    )}
  </PDFDownloadLink>
);

export default PDFReportGeneratorCLP;
