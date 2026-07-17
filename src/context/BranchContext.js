"use client";

import { createContext, useContext, useState } from "react";

const BranchContext = createContext(null);

const BRANCHES = ["All Branches", "Lagos HQ", "Ibadan Depot"];

export const BRANCH_OPTIONS = BRANCHES;

export function BranchProvider({ children }) {
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, BRANCHES }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
