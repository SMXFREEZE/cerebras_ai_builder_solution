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
    window.location.reload();
  }

  const label =
    role === "tech" ? "Switch to manager view" : "Switch to tech view";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-[44px] rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
      aria-label={label}
    >
      <span className="mr-2 text-gray-500">role: {role}</span>
      <span className="font-medium">{role === "tech" ? "Manager" : "Tech"}</span>
    </button>
  );
}
