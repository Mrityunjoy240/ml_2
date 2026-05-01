import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { housePriceDataset } from "@/lib/dataset";
import Papa from "papaparse";
import { UploadCloud, FileType2, ChevronRight, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Act2YourData() {
  const { dataset, setDataset, targetColumn, setTargetColumn, featureColumns, setFeatureColumns } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default setup
  const useSampleDataset = () => {
    setDataset(housePriceDataset as any);
    setTargetColumn("price");
    setFeatureColumns(["sqft"]);
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        setDataset(results.data as any);
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

  const handleNextStep3 = () => {
    if (targetColumn && featureColumns.length > 0) {
      setStep(3);
    }
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
            className="grid md:grid-cols-2 gap-8"
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
                    <p className="text-sm text-muted-foreground mb-4">What is the main clue?</p>
                    <Select 
                      value={featureColumns[0] || ""} 
                      onValueChange={(val) => setFeatureColumns([val])}
                    >
                      <SelectTrigger data-testid="select-feature">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col} value={col} disabled={col === targetColumn} data-testid={`option-feature-${col}`}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Badge variant="outline" className="text-primary border-primary/30">1 Feature</Badge>
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
