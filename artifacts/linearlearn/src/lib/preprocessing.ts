import type { DataRow } from "@/context/AppState";
import { mean, min, max, stdDev } from "@/lib/math";

export type MissingStrategy = "none" | "mean";
export type EncodingStrategy = "none" | "label" | "onehot";
export type ScalingStrategy = "none" | "standardize" | "normalize";
export interface PreprocessingAssessment {
  readinessScore: number;
  issues: string[];
  strengths: string[];
}

function isNumericColumn(data: DataRow[], col: string) {
  return data.some((r) => Number.isFinite(Number(r[col])));
}

export function inferColumnType(data: DataRow[], col: string) {
  return isNumericColumn(data, col) ? "number" : "category";
}

export function countMissingValues(data: DataRow[], col: string) {
  return data.filter((r) => {
    const value = r[col];
    return value === "" || value === null || value === undefined || Number.isNaN(value);
  }).length;
}

export function applyMissingValueHandling(data: DataRow[], strategy: MissingStrategy): DataRow[] {
  if (strategy === "none" || !data.length) return data;
  const cols = Object.keys(data[0]);
  const numericCols = cols.filter((c) => isNumericColumn(data, c));
  const means: Record<string, number> = {};
  for (const c of numericCols) {
    const vals = data.map((r) => Number(r[c])).filter((v) => Number.isFinite(v));
    means[c] = vals.length ? mean(vals) : 0;
  }
  return data.map((row) => {
    const next: DataRow = { ...row };
    for (const c of numericCols) {
      const v = Number(next[c]);
      if (!Number.isFinite(v)) next[c] = means[c];
    }
    return next;
  });
}

export function applyEncoding(data: DataRow[], strategy: EncodingStrategy): DataRow[] {
  if (strategy === "none" || !data.length) return data;
  const cols = Object.keys(data[0]);
  const categoricalCols = cols.filter((c) => !isNumericColumn(data, c));
  if (strategy === "label") {
    const categoryMap: Record<string, Map<string, number>> = {};
    for (const c of categoricalCols) {
      categoryMap[c] = new Map([...new Set(data.map((r) => String(r[c])))].map((v, i) => [v, i]));
    }
    return data.map((row) => {
      const next: DataRow = { ...row };
      for (const c of categoricalCols) next[c] = categoryMap[c].get(String(row[c])) ?? 0;
      return next;
    });
  }
  const categoryMap: Record<string, string[]> = {};
  for (const c of categoricalCols) {
    categoryMap[c] = [...new Set(data.map((r) => String(r[c])))];
  }
  return data.map((row) => {
    const next: DataRow = { ...row };
    for (const c of categoricalCols) {
      delete next[c];
      for (const cat of categoryMap[c]) next[`${c}_${cat}`] = String(row[c]) === cat ? 1 : 0;
    }
    return next;
  });
}

export function applyScaling(data: DataRow[], strategy: ScalingStrategy): DataRow[] {
  if (strategy === "none" || !data.length) return data;
  const cols = Object.keys(data[0]).filter((c) => isNumericColumn(data, c));
  const stats: Record<string, { m: number; s: number; mn: number; mx: number }> = {};
  for (const c of cols) {
    const vals = data.map((r) => Number(r[c]));
    stats[c] = { m: mean(vals), s: stdDev(vals), mn: min(vals), mx: max(vals) };
  }
  return data.map((row) => {
    const next: DataRow = { ...row };
    for (const c of cols) {
      const v = Number(next[c]);
      if (!Number.isFinite(v)) continue;
      if (strategy === "standardize") next[c] = stats[c].s === 0 ? 0 : (v - stats[c].m) / stats[c].s;
      if (strategy === "normalize") next[c] = stats[c].mx === stats[c].mn ? 0 : (v - stats[c].mn) / (stats[c].mx - stats[c].mn);
    }
    return next;
  });
}

export function assessPreprocessingChoices(
  rawData: DataRow[],
  processedData: DataRow[],
  missingStrategy: MissingStrategy,
  encodingStrategy: EncodingStrategy,
  scalingStrategy: ScalingStrategy,
): PreprocessingAssessment {
  if (!rawData.length || !processedData.length) {
    return {
      readinessScore: 0,
      issues: ["No dataset is loaded yet."],
      strengths: [],
    };
  }

  let readinessScore = 100;
  const issues: string[] = [];
  const strengths: string[] = [];
  const rawColumns = Object.keys(rawData[0]);
  const processedColumns = Object.keys(processedData[0]);
  const categoricalColumns = rawColumns.filter((col) => inferColumnType(rawData, col) === "category");
  const missingColumns = rawColumns.filter((col) => countMissingValues(rawData, col) > 0);

  if (missingColumns.length > 0 && missingStrategy === "none") {
    readinessScore -= 25;
    issues.push("Missing values are still present. A real model can break or learn from the wrong signal.");
  } else if (missingColumns.length > 0 && missingStrategy === "mean") {
    strengths.push("Missing numeric values were handled before training.");
  }

  if (categoricalColumns.length > 0 && encodingStrategy === "none") {
    readinessScore -= 30;
    issues.push("Categorical columns are still text. Regression needs numbers, so these fields must be encoded.");
  } else if (categoricalColumns.length > 0) {
    strengths.push("Categorical fields were converted into numeric form.");
  }

  if (scalingStrategy === "none") {
    issues.push("No scaling was applied. This is not always wrong, but large feature ranges can dominate the model.");
    readinessScore -= 10;
  } else {
    strengths.push("Feature scaling was applied so the numeric ranges are more comparable.");
  }

  if (encodingStrategy === "onehot" && processedColumns.length > rawColumns.length) {
    strengths.push("One-hot encoding expanded categories into separate binary columns, which is often the safest choice for linear models.");
  }

  if (encodingStrategy === "label") {
    issues.push("Label encoding is compact, but it can accidentally imply order between categories.");
    readinessScore -= 10;
  }

  readinessScore = Math.max(0, Math.min(100, readinessScore));

  if (issues.length === 0) {
    strengths.push("This pipeline looks ready for training.");
  }

  return { readinessScore, issues, strengths };
}
