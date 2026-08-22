import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { contractsCol, messagesCol, threadsCol } from "@/lib/firestore-collections";

// Public, no-auth route — a client signs from an emailed link, not a
// logged-in session. Signature capture is a lightweight type-name-to-sign
// record (name + timestamp + IP), the same mechanism Pixieset/HoneyBook use
// for standard service contracts, not a cryptographic e-signature vendor.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { signerName } = await request.json().catch(() => ({}));
  if (!signerName || typeof signerName !== "string" || !signerName.trim()) {
    return NextResponse.json({ error: "Your full name is required to sign." }, { status: 400 });
  }

  const snap = await contractsCol().where("signToken", "==", token).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  const contractDoc = snap.docs[0];
  const contract = contractDoc.data();

  if (contract.status === "signed") {
    return NextResponse.json({ error: "This contract has already been signed." }, { status: 400 });
  }
  if (contract.status !== "sent") {
    return NextResponse.json({ error: "This contract is not ready to be signed yet." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  await contractDoc.ref.update({
    status: "signed",
    signerName: signerName.trim(),
    signedAt: FieldValue.serverTimestamp(),
    signedIp: ip,
  });

  if (contract.threadId) {
    await messagesCol(contract.threadId).add({
      direction: "system",
      body: `Contract "${contract.title}" — signed by ${signerName.trim()}`,
      mailgunMessageId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await threadsCol().doc(contract.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
  }

  return NextResponse.json({ ok: true });
}
