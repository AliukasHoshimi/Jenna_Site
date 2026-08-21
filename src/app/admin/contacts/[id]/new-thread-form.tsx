"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function NewThreadForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, subject }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.id) router.push(`/admin/threads/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        placeholder="Subject for a new conversation…"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
      >
        Start
      </button>
    </form>
  );
}
