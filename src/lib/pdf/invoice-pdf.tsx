import { Document, Page, Text, View, StyleSheet, Link, Svg, Circle, Line } from "@react-pdf/renderer";
import { colors } from "@/lib/design-tokens";

// react-pdf renders on the server with its own layout engine (no headless
// browser). We stick to its built-in Helvetica family rather than
// registering custom fonts, to avoid fetching font files at render time in
// a serverless/Cloud Run environment. Swap in real brand fonts once font
// files are available to bundle locally. The header band below is a plain
// color fill, not a real photo of Jenna's work — drop one in as an <Image>
// once she has a hero shot she wants used here.
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  band: {
    backgroundColor: colors.accent,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 48,
    paddingVertical: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  icon: { marginRight: 10 },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.accentContrast,
    letterSpacing: 1,
  },
  meta: { alignItems: "flex-end" },
  metaLabel: {
    color: colors.accentTint,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8, color: colors.accentContrast },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 2,
    marginHorizontal: 40,
    marginTop: -18,
    padding: 28,
  },
  divider: {
    width: 56,
    height: 1,
    backgroundColor: colors.warm,
    transform: "rotate(-5deg)",
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    color: colors.warm,
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  billTo: { fontSize: 11, lineHeight: 1.5 },
  table: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  tableHeaderRow: { flexDirection: "row", paddingVertical: 8 },
  cellDescription: { flex: 1, fontSize: 10 },
  cellAmount: { width: 90, textAlign: "right", fontSize: 10 },
  headerCell: {
    color: colors.muted,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, marginRight: 16 },
  totalsValue: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  payButton: {
    marginTop: 32,
    backgroundColor: colors.warm,
    color: colors.accentContrast,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignSelf: "flex-start",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    textDecoration: "none",
  },
  footerWrap: { paddingHorizontal: 48, paddingTop: 28 },
  footer: { fontSize: 8, color: colors.muted },
});

function LensIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26" style={styles.icon}>
      <Circle cx={13} cy={13} r={11} stroke={colors.accentContrast} strokeWidth={1.5} fill="none" />
      <Line x1={6} y1={9} x2={19} y2={17.5} stroke={colors.accentContrast} strokeWidth={0.75} />
      <Circle cx={13} cy={13} r={4} fill={colors.warm} />
    </Svg>
  );
}

interface InvoicePdfProps {
  invoiceNumber: string;
  dueDateLabel: string;
  clientName: string;
  clientEmail: string;
  lineItems: { description: string; amount: number }[];
  amountTotal: number;
  currency: string;
  checkoutUrl: string | null;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function InvoicePdf(props: InvoicePdfProps) {
  return (
    <Document title={`Invoice ${props.invoiceNumber} — Samsarafilmss`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <View style={styles.brandRow}>
            <LensIcon />
            <Text style={styles.brand}>SAMSARAFILMSS</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Invoice</Text>
            <Text style={styles.metaValue}>#{props.invoiceNumber}</Text>
            <Text style={styles.metaLabel}>Due</Text>
            <Text style={styles.metaValue}>{props.dueDateLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>— Billed To</Text>
            <View style={styles.billTo}>
              <Text>{props.clientName}</Text>
              <Text>{props.clientEmail}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>— Line Items</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cellDescription, styles.headerCell]}>Description</Text>
                <Text style={[styles.cellAmount, styles.headerCell]}>Amount</Text>
              </View>
              {props.lineItems.map((item, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.cellDescription}>{item.description}</Text>
                  <Text style={styles.cellAmount}>{formatMoney(item.amount, props.currency)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total</Text>
              <Text style={styles.totalsValue}>{formatMoney(props.amountTotal, props.currency)}</Text>
            </View>
          </View>

          {props.checkoutUrl && (
            <Link src={props.checkoutUrl} style={styles.payButton}>
              Pay Now
            </Link>
          )}
        </View>

        <View style={styles.footerWrap}>
          <View style={styles.divider} />
          <Text style={styles.footer}>
            Samsarafilmss · Thank you for booking with us. Questions about this invoice? Just reply
            to the email it was sent with.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
