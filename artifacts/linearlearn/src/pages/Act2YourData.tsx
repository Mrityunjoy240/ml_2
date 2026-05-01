import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { housePriceDataset, messyHousePriceDataset } from "@/lib/dataset";
import Papa from "papaparse";
import { UploadCloud, FileType2, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  applyEncoding,
  applyMissingValueHandling,
  applyScaling,
  assessPreprocessingChoices,
  countMissingValues,
  inferColumnType,
  type EncodingStrategy,
  type MissingStrategy,
  type ScalingStrategy,
} from "@/lib/preprocessing";

export default function Act2YourData() {
  const { dataset, setDataset, targetColumn, setTargetColumn, featureColumns, setFeatureColumns } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const [rawDataset, setRawDataset] = useState<any[]>([]);
  const [missingStrategy, setMissingStrategy] = useState<MissingStrategy>("none");
  const [encodingStrategy, setEncodingStrategy] = useState<EncodingStrategy>("none");
  const [scalingStrategy, setScalingStrategy] = useState<ScalingStrategy>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [datasetPersistenceLimited, setDatasetPersistenceLimited] = useState(false);
  const [dataMode, setDataMode] = useState<"sample" | "messy" | "upload">("sample");

  useEffect(() => {
    try {
      setDatasetPersistenceLimited(localStorage.getItem("ll_dataset_truncated") === "1");
    } catch {
      setDatasetPersistenceLimited(false);
    }
  }, [dataset.length]);

  // Default setup
  const useSampleDataset = () => {
    setDataMode("sample");
    setRawDataset(housePriceDataset as any);
    setDataset(housePriceDataset as any);
    setTargetColumn("price");
    setFeatureColumns(["sqft"]);
    setStep(2);
  };

  const useMessyDataset = () => {
    setDataMode("messy");
    setRawDataset(messyHousePriceDataset as any);
    setDataset(messyHousePriceDataset as any);
    setTargetColumn("price");
    setFeatureColumns(["sqft", "bedrooms"]);
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setDataMode("upload");
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setDataset(results.data as any);
        setRawDataset(results.data as any);
        setUploading(false);
        setStep(2);
      },
      error: (error) => {
        console.error("Error parsing CSV", error);
        setUploading(false);
      }
    });
  };

  const columns = dataset.length > 0 ? Object.keys(dataset[0]) : [];
  const rawColumns = rawDataset.length > 0 ? Object.keys(rawDataset[0]) : [];
  const activeRawDataset = rawDataset.length ? rawDataset : dataset;
  const missingCount = columns.reduce((sum, col) => sum + countMissingValues(dataset, col), 0);
  const messyHints = [
    "Missing numeric values need a plan before training.",
    "Categorical columns cannot be used directly in regression.",
    "Some columns may be useful, but some may add noise.",
  ];
  const assessment = assessPreprocessingChoices(
    activeRawDataset,
    dataset,
    missingStrategy,
    encodingStrategy,
    scalingStrategy,
  );

  const applyPreprocessing = () => {
    let next = [...activeRawDataset];
    next = applyMissingValueHandling(next, missingStrategy);
    next = applyEncoding(next, encodingStrategy);
    next = applyScaling(next, scalingStrategy);
    setDataset(next as any);
    const processedColumns = next.length > 0 ? Object.keys(next[0]) : [];
    if (targetColumn && !processedColumns.includes(targetColumn)) setTargetColumn("");
    if (featureColumns[0] && !processedColumns.includes(featureColumns[0])) setFeatureColumns([]);
  };

  const handleNextStep3 = () => {
    if (targetColumn && featureColumns.length > 0) {
      setStep(3);
    }
  };

  const toggleFeature = (col: string) => {
    setFeatureColumns(
      featureColumns.includes(col)
        ? featureColumns.filter((feature) => feature !== col)
        : [...featureColumns, col],
    );
  };

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Your Data</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Data is the fuel for linear regression. The model learns from history.
          Let's load some history.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Upload Zone */}
            <div 
              className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer bg-card/50"
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone"
            >
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Upload a CSV</h3>
              <p className="text-muted-foreground mb-6">Must have numerical columns</p>
              <Button disabled={uploading} variant="secondary">
                {uploading ? "Parsing..." : "Browse Files"}
              </Button>
            </div>

            {/* Sample Dataset */}
            <div className="border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center bg-card/50">
              <FileType2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Use Sample Data</h3>
              <p className="text-muted-foreground mb-6">King County House Prices</p>
              <Button onClick={useSampleDataset} data-testid="btn-use-sample">
                Load Sample Data
              </Button>
            </div>

            <div className="border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center bg-card/50">
              <FileType2 className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-medium mb-2">Messy Data Lab</h3>
              <p className="text-muted-foreground mb-6">Nulls, categories, and uneven columns</p>
              <Button onClick={useMessyDataset} variant="secondary" data-testid="btn-use-messy">
                Load Messy Dataset
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-card border border-border p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-medium mb-6">Define the Roles</h3>
              
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs">Y</span>
                      Target Variable
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">What are you trying to predict?</p>
                    <Select value={targetColumn} onValueChange={setTargetColumn}>
                      <SelectTrigger data-testid="select-target">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col} value={col} data-testid={`option-target-${col}`}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs">X</span>
                      Feature Variable
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">Choose one clue for simple regression, or several for multiple regression.</p>
                    <div className="flex flex-wrap gap-2">
                      {columns.filter((col) => col !== targetColumn).map((col) => {
                        const active = featureColumns.includes(col);
                        return (
                          <Button
                            key={col}
                            type="button"
                            variant={active ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleFeature(col)}
                            data-testid={`toggle-feature-${col}`}
                          >
                            {col}
                          </Button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-3">
                      Selected: {featureColumns.length ? featureColumns.join(", ") : "none"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleNextStep3} 
                  disabled={!targetColumn || featureColumns.length === 0}
                  className="gap-2"
                  data-testid="btn-next-step3"
                >
                  Analyze Data <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-8 border-t border-border pt-6 space-y-5">
                <h4 className="text-lg font-medium">Preprocessing Lab</h4>
                <p className="text-sm text-muted-foreground">What & why: make data clean and numeric so the model can learn patterns reliably.</p>
                {dataMode === "messy" && (
                  <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-medium text-primary">Messy Data Practice</div>
                    {messyHints.map((hint) => (
                      <div key={hint} className="text-sm text-muted-foreground">{hint}</div>
                    ))}
                  </div>
                )}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Shape</div>
                    <div className="mt-1 font-mono text-lg">{dataset.length} x {columns.length}</div>
                  </div>
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Missing Cells</div>
                    <div className="mt-1 font-mono text-lg">{missingCount}</div>
                  </div>
                  <div className="border border-border rounded-lg p-4 bg-muted/20">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected Pipeline</div>
                    <div className="mt-1 text-sm">{missingStrategy} / {encodingStrategy} / {scalingStrategy}</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Select value={missingStrategy} onValueChange={(v) => setMissingStrategy(v as MissingStrategy)}>
                    <SelectTrigger><SelectValue placeholder="Missing values" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Missing: None</SelectItem>
                      <SelectItem value="mean">Missing: Mean Imputation</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={encodingStrategy} onValueChange={(v) => setEncodingStrategy(v as EncodingStrategy)}>
                    <SelectTrigger><SelectValue placeholder="Encoding" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Encoding: None</SelectItem>
                      <SelectItem value="label">Encoding: Label</SelectItem>
                      <SelectItem value="onehot">Encoding: One-hot</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scalingStrategy} onValueChange={(v) => setScalingStrategy(v as ScalingStrategy)}>
                    <SelectTrigger><SelectValue placeholder="Scaling" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Scaling: None</SelectItem>
                      <SelectItem value="standardize">Scaling: Standardization</SelectItem>
                      <SelectItem value="normalize">Scaling: Normalization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="secondary" onClick={applyPreprocessing}>Apply Preprocessing</Button>
                <div className="text-xs text-muted-foreground">Before columns: {rawColumns.join(", ") || "none"} | After columns: {columns.join(", ") || "none"}</div>
                {datasetPersistenceLimited && (
                  <div className="border border-accent/30 bg-accent/10 text-accent rounded-lg px-4 py-3 text-sm">
                    Large datasets are loaded normally, but only the first 250 rows are saved for refresh/revisit state.
                  </div>
                )}
                <div className="border border-border rounded-lg p-5 space-y-4 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Model Readiness</div>
                      <div className="text-xs text-muted-foreground">How safe is this current preprocessing path for a beginner workflow?</div>
                    </div>
                    <div className="text-2xl font-mono text-primary">{assessment.readinessScore}%</div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-primary">What is helping</div>
                      {assessment.strengths.map((item) => (
                        <div key={item} className="text-muted-foreground">{item}</div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-accent">Likely beginner mistakes</div>
                      {assessment.issues.map((item) => (
                        <div key={item} className="text-muted-foreground">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left">Column</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col) => (
                        <tr key={col} className="border-t border-border/60">
                          <td className="px-4 py-2 font-mono">{col}</td>
                          <td className="px-4 py-2">{inferColumnType(dataset, col)}</td>
                          <td className="px-4 py-2 font-mono">{countMissingValues(dataset, col)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Tabs defaultValue="tables" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tables">Before / After</TabsTrigger>
                    <TabsTrigger value="code">Code Mirror</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tables" className="mt-4">
                    <div className="grid lg:grid-cols-2 gap-4">
                      <DataPreviewTable title="Before preprocessing" data={activeRawDataset} columns={rawColumns} />
                      <DataPreviewTable title="After preprocessing" data={dataset} columns={columns} />
                    </div>
                  </TabsContent>
                  <TabsContent value="code" className="mt-4">
                    <CodeMirrorPanel
                      targetColumn={targetColumn}
                      featureColumns={featureColumns}
                      missingStrategy={missingStrategy}
                      encodingStrategy={encodingStrategy}
                      scalingStrategy={scalingStrategy}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-3 gap-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center"
              >
                <div className="text-4xl font-mono font-medium text-primary mb-2">{dataset.length}</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Records</div>
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center"
              >
                <div className="text-xl font-medium text-accent mb-2">Clean</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Data Health</div>
              </motion.div>

              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.3 }}
                className="bg-card border border-border p-6 rounded-xl flex flex-col items-center justify-center text-center"
              >
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="text-primary border-primary/30">{featureColumns.length} Feature{featureColumns.length === 1 ? "" : "s"}</Badge>
                  <Badge variant="outline" className="text-accent border-accent/30">1 Target</Badge>
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Shape</div>
              </motion.div>
            </div>

            {/* Snippet of data */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20">
                <h4 className="font-medium text-sm text-muted-foreground">Data Preview (First 5 rows)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-muted-foreground bg-muted/10 border-b border-border">
                    <tr>
                      {columns.map(col => (
                        <th key={col} className={`px-6 py-3 font-medium ${col === targetColumn ? 'text-accent' : col === featureColumns[0] ? 'text-primary' : ''}`}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/10">
                        {columns.map(col => (
                          <td key={col} className="px-6 py-3 font-mono">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <CheckpointQuiz 
                actNumber={2}
                question="The variable you want to predict is called the:"
                options={[
                  { id: "A", text: "Feature Variable (X)" },
                  { id: "B", text: "Target Variable (Y)" },
                  { id: "C", text: "Constant" },
                  { id: "D", text: "Loss Function" }
                ]}
                correctOptionId="B"
                nextRoute="/act/3"
              />
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem 
        actNumber={2}
        screenTitle="Your Data"
        currentConcept="Features vs Targets"
        explanations={{
          simple: "The target is what you want to know. The features are the clues you have right now.",
          story: "A detective arrives at a crime scene. The clues (fingerprints, timeline) are features. The identity of the culprit is the target.",
          math: "In y = f(x), y is the target. x is the feature. We are trying to discover the function f."
        }}
        soWhat="Without cleanly defining what we know (X) and what we want to find out (Y), the algorithm doesn't know what problem to solve."
      />
    </div>
  );
}

function CodeMirrorPanel({
  targetColumn,
  featureColumns,
  missingStrategy,
  encodingStrategy,
  scalingStrategy,
}: {
  targetColumn: string;
  featureColumns: string[];
  missingStrategy: MissingStrategy;
  encodingStrategy: EncodingStrategy;
  scalingStrategy: ScalingStrategy;
}) {
  const featureList = featureColumns.length ? featureColumns.map((col) => `"${col}"`).join(", ") : `"sqft"`;
  const target = targetColumn || "price";
  const missingLine =
    missingStrategy === "mean"
      ? `df = df.fillna(df.mean(numeric_only=True))`
      : `# keep missing values unchanged for now`;
  const encodingLine =
    encodingStrategy === "label"
      ? `# label encoding would convert text categories into integer ids`
      : encodingStrategy === "onehot"
        ? `df = pd.get_dummies(df, drop_first=False)`
        : `# no categorical encoding applied`;
  const scalingLine =
    scalingStrategy === "standardize"
      ? `X = (X - X.mean()) / X.std(ddof=0)`
      : scalingStrategy === "normalize"
        ? `X = (X - X.min()) / (X.max() - X.min())`
        : `# no feature scaling applied`;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-muted/20 text-sm font-medium">Python equivalent of this step</div>
      <pre className="p-4 text-xs md:text-sm overflow-x-auto font-mono leading-6 bg-card">
{`import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_csv("your_dataset.csv")
print(df.head())
print(df.isnull().sum())

${missingLine}
${encodingLine}

X = df[[${featureList}]]
y = df["${target}"]

${scalingLine}

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)`}
      </pre>
    </div>
  );
}

function formatCell(value: unknown) {
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(3);
  if (value === null || value === undefined || value === "") return "missing";
  return String(value);
}

function DataPreviewTable({ title, data, columns }: { title: string; data: any[]; columns: string[] }) {
  const shownColumns = columns.slice(0, 5);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-muted/20 text-sm font-medium">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr>
              {shownColumns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, i) => (
              <tr key={i} className="border-t border-border/60">
                {shownColumns.map((col) => (
                  <td key={col} className="px-3 py-2 font-mono whitespace-nowrap">{formatCell(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
