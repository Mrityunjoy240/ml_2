import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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
  worksheetScores: Record<number, number>;
  setWorksheetScore: (act: number, score: number) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

const DATASET_STORAGE_KEY = "ll_dataset";
const DATASET_TRUNCATED_KEY = "ll_dataset_truncated";
const MAX_PERSISTED_DATASET_ROWS = 250;

function safeGetItem(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [userGuess, setUserGuess] = useState<number | null>(() => {
    const raw = safeGetItem("ll_userGuess");
    return raw ? Number(raw) : null;
  });
  const [dataset, setDataset] = useState<DataRow[]>(() => JSON.parse(safeGetItem(DATASET_STORAGE_KEY) || "[]"));
  const [targetColumn, setTargetColumn] = useState<string>(() => safeGetItem("ll_targetColumn") || "");
  const [featureColumns, setFeatureColumns] = useState<string[]>(() => JSON.parse(safeGetItem("ll_featureColumns") || "[]"));
  const [model, setModel] = useState(() => JSON.parse(safeGetItem("ll_model") || '{"b0":0,"b1":0,"coefficients":{}}'));
  const [completedActs, setCompletedActs] = useState<Set<number>>(() => new Set<number>(JSON.parse(safeGetItem("ll_completedActs") || "[]")));
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(() => JSON.parse(safeGetItem("ll_glossary") || "[]"));
  const [worksheetScores, setWorksheetScores] = useState<Record<number, number>>(() => JSON.parse(safeGetItem("ll_worksheetScores") || "{}"));

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
  const setWorksheetScore = (act: number, score: number) => {
    setWorksheetScores((prev) => {
      const next = { ...prev, [act]: Math.max(score, prev[act] ?? 0) };
      return next;
    });
  };

  useEffect(() => {
    safeSetItem("ll_userGuess", String(userGuess ?? ""));
  }, [userGuess]);

  useEffect(() => {
    const persistedDataset = dataset.slice(0, MAX_PERSISTED_DATASET_ROWS);
    const persistedJson = JSON.stringify(persistedDataset);
    const saved = safeSetItem(DATASET_STORAGE_KEY, persistedJson);
    if (!saved) {
      safeRemoveItem(DATASET_STORAGE_KEY);
      safeSetItem(DATASET_TRUNCATED_KEY, "1");
      return;
    }
    if (dataset.length > MAX_PERSISTED_DATASET_ROWS) {
      safeSetItem(DATASET_TRUNCATED_KEY, "1");
    } else {
      safeRemoveItem(DATASET_TRUNCATED_KEY);
    }
  }, [dataset]);

  useEffect(() => {
    safeSetItem("ll_targetColumn", targetColumn);
  }, [targetColumn]);
  useEffect(() => {
    safeSetItem("ll_featureColumns", JSON.stringify(featureColumns));
  }, [featureColumns]);
  useEffect(() => {
    safeSetItem("ll_model", JSON.stringify(model));
  }, [model]);
  useEffect(() => {
    safeSetItem("ll_completedActs", JSON.stringify([...completedActs]));
  }, [completedActs]);
  useEffect(() => {
    safeSetItem("ll_glossary", JSON.stringify(glossary));
  }, [glossary]);
  useEffect(() => {
    safeSetItem("ll_worksheetScores", JSON.stringify(worksheetScores));
  }, [worksheetScores]);

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
        worksheetScores,
        setWorksheetScore,
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
