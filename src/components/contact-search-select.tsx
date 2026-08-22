"use client";

import { useEffect, useRef, useState } from "react";

interface ContactOption {
  id: string;
  name: string;
  email: string;
}

export function ContactSearchSelect({
  contacts,
  value,
  onChange,
  placeholder = "Search clients…",
}: {
  contacts: ContactOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = contacts.find((c) => c.id === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className="relative">
      <input
        value={open ? query : selected ? `${selected.name} — ${selected.email}` : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-muted">No matches.</p>}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setQuery("");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-background"
            >
              <span className="text-foreground">{c.name}</span> <span className="text-muted">— {c.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
