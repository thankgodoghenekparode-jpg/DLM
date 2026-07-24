"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const me = await api.get("/auth/me");
        if (me?.tenant?.branches?.length) {
          const names = me.tenant.branches.map((b) => b.name || b);
          setBranches(["All Branches", ...names]);
        } else if (me?.branches?.length) {
          const names = me.branches.map((b) => b.name || b);
          setBranches(["All Branches", ...names]);
        } else {
          setBranches(["All Branches"]);
        }
      } catch {
        setBranches(["All Branches"]);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);

  return (
    <BranchContext.Provider value={{ branches, selectedBranch, setSelectedBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}