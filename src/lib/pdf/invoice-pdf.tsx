import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { colors } from "@/lib/design-tokens";

// react-pdf renders on the server with its own layout engine (no headless
// browser). We stick to its built-in Helvetica family rather than
// registering custom fonts, to avoid fetching font files at render time in
// a serverless/Cloud Run environment. Swap in real brand fonts once font
// files are available to bundle locally.
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    color: colors.foreground,
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    letterSpacing: 1,
  },
  meta: { alignItems: "flex-end" },
  metaLabel: { color: colors.muted, fontSize: 9, marginBottom: 2 },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8 },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    marginTop: 36,
    backgroundColor: colors.accent,
    color: colors.accentContrast,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignSelf: "flex-start",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textDecoration: "none",
  },
  footer: { marginTop: 40, fontSize: 8, color: colors.muted },
});

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
        <View style={styles.header}>
          <Text style={styles.brand}>SAMSARAFILMSS</Text>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Invoice</Text>
            <Text style={styles.metaValue}>#{props.invoiceNumber}</Text>
            <Text style={styles.metaLabel}>Due</Text>
            <Text style={styles.metaValue}>{props.dueDateLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Billed To</Text>
          <View style={styles.billTo}>
            <Text>{props.clientName}</Text>
            <Text>{props.clientEmail}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Line Items</Text>
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

        <Text style={styles.footer}>
          Samsarafilmss · Thank you for booking with us. Questions about this invoice? Just reply
          to the email it was sent with.
        </Text>
      </Page>
    </Document>
  );
}
