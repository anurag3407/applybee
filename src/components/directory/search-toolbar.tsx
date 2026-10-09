"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { IconSearch } from "@/components/svg/icons";
import { Input, Select, Button } from "@/components/ui/primitives";

const DEPARTMENTS = [
  { value: "", label: "All professions" },
  { value: "engineering", label: "Software & Engineering" },
  { value: "design", label: "Product & Design" },
  { value: "content", label: "Content & Writing" },
  { value: "sales", label: "Sales & BizDev" },
  { value: "product_ops", label: "Product & Operations" },
];

const ROLES = [
  { value: "", label: "All roles" },
  { value: "engineering_manager", label: "Engineering manager" },
  { value: "tech_lead", label: "Tech lead" },
  { value: "vp_engineering", label: "VP / Director" },
  { value: "recruiter", label: "Recruiter" },
  { value: "founder", label: "Founder" },
];
const STAGES = [
  { value: "", label: "Any stage" },
  { value: "tier1", label: "Tier-1" },
  { value: "unicorn", label: "Unicorn" },
  { value: "growth", label: "Growth" },
  { value: "startup", label: "Early-stage startup" },
];
const VERIFICATIONS = [
  { value: "", label: "Any verification" },
  { value: "verified", label: "Verified" },
  { value: "catch_all", label: "Catch-all" },
  { value: "unknown", label: "Unknown" },
];

/** URL-driven search/filters (§12.3): shareable, validated, debounced. */
export function SearchToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      next.delete("cursor");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("cursor");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="group relative min-w-56 flex-1">
        <IconSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors duration-150 group-focus-within:text-ink"
        />
        <Input
          aria-label="Search contacts"
          placeholder="Search name, title, or company…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={200}
          className="pl-9"
        />
      </div>
      <Select aria-label="Profession track" value={params.get("dept") ?? ""} onChange={(e) => setParam("dept", e.target.value)} className="w-auto min-w-44">
        {DEPARTMENTS.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </Select>
      <Select aria-label="Role filter" value={params.get("role") ?? ""} onChange={(e) => setParam("role", e.target.value)} className="w-auto min-w-44">
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </Select>
      <Input
        aria-label="Location filter"
        placeholder="Location"
        defaultValue={params.get("location") ?? ""}
        maxLength={200}
        className="w-36"
        onBlur={(e) => setParam("location", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && setParam("location", (e.target as HTMLInputElement).value)}
      />
      <Select aria-label="Company stage filter" value={params.get("stage") ?? ""} onChange={(e) => setParam("stage", e.target.value)} className="w-auto min-w-40">
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>
      <Select aria-label="Verification filter" value={params.get("verification") ?? ""} onChange={(e) => setParam("verification", e.target.value)} className="w-auto min-w-40">
        {VERIFICATIONS.map((v) => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </Select>
      {params.toString() ? (
        <Button size="sm" variant="ghost" onClick={() => router.replace(pathname, { scroll: false })}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
