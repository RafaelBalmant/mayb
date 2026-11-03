"use client";
import { createContext, useContext } from "react";

// The parsed drawings (lib/server/faces.js), handed down by the face-map page so every Face can draw them.
const FacesContext = createContext({});

export const FacesProvider = ({ faces, children }) => (
  <FacesContext.Provider value={faces}>{children}</FacesContext.Provider>
);

/** Parsed illustration for a face ("female" | "male") and a view ("front" | "profile"). */
export const useFace = (face, view) => useContext(FacesContext)[face]?.[view];
