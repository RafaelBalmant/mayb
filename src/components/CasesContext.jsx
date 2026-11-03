"use client";
import { createContext, useContext } from "react";

// The real cases (lib/server/cases.js), read at build time and handed down by the pages that show them.
const CasesContext = createContext([]);

export const CasesProvider = ({ cases, children }) => (
  <CasesContext.Provider value={cases}>{children}</CasesContext.Provider>
);

/** The cases ready to show (see domain/cases.js loadCases). */
export const useCases = () => useContext(CasesContext);
