import { createContext, useContext, useState, ReactNode } from "react";

export interface DataRow {
  [key: string]: string | number;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface AppState {
  userGuess: number | null;
  setUserGuess: (guess: number | null) => void;
  dataset: DataRow[];
  setDataset: (data: DataRow[]) => void;
  targetColumn: string;
  setTargetColumn: (col: string) => void;
  featureColumns: string[];
  setFeatureColumns: (cols: string[]) => void;
  model: { b0: number; b1: number; coefficients: Record<string, number> };
  setModel: (model: { b0: number; b1: number; coefficients: Record<string, number> }) => void;
  completedActs: Set<number>;
  markActComplete: (act: number) => void;
  glossary: GlossaryTerm[];
  addGlossaryTerm: (term: GlossaryTerm) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [userGuess, setUserGuess] = useState<number | null>(null);
  const [dataset, setDataset] = useState<DataRow[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [model, setModel] = useState({ b0: 0, b1: 0, coefficients: {} });
  const [completedActs, setCompletedActs] = useState<Set<number>>(new Set());
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);

  const markActComplete = (act: number) => {
    setCompletedActs((prev) => {
      const next = new Set(prev);
      next.add(act);
      return next;
    });
  };

  const addGlossaryTerm = (term: GlossaryTerm) => {
    setGlossary((prev) => {
      if (prev.find((t) => t.term === term.term)) return prev;
      return [...prev, term];
    });
  };

  return (
    <AppStateContext.Provider
      value={{
        userGuess,
        setUserGuess,
        dataset,
        setDataset,
        targetColumn,
        setTargetColumn,
        featureColumns,
        setFeatureColumns,
        model,
        setModel,
        completedActs,
        markActComplete,
        glossary,
        addGlossaryTerm,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
