"use client";

import { useEffect, useState } from "react";
import { getRole, setRole, type Role } from "@/lib/auth";

export function RoleSwitcher() {
  const [role, setRoleState] = useState<Role>("tech");

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  function handleClick(): void {
    const next: Role = role === "tech" ? "manager" : "tech";
    setRole(next);
    setRoleState(next);
  }

  const label =
    role === "tech" ? "Switch to manager view" : "Switch to tech view";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-[40px] shrink-0 rounded-md border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-slate-100 transition hover:border-cyan-200/40 hover:bg-cyan-200/10 sm:min-h-[44px]"
      aria-label={label}
    >
      <span className="mr-2 hidden text-slate-400 sm:inline">role: {role}</span>
      <span className="font-medium">{role === "tech" ? "Manager" : "Tech"}</span>
    </button>
  );
}
