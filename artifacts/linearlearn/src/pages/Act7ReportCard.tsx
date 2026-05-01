import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { rSquared, mae, mse, kFoldCV, predictRow } from "@/lib/math";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function Act7ReportCard() {
  const { dataset, targetColumn, featureColumns, model, addGlossaryTerm } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [kFolds, setKFolds] = useState(5);

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";
  const features = featureColumns.length ? featureColumns : [feature];

  const featureVals = dataset.length ? dataset.map((row) => Number(row[feature])) : [1000, 2000];
  const targetVals = dataset.length ? dataset.map((row) => Number(row[target])) : [200000, 300000];
  const featureMatrix = dataset.length
    ? dataset.map((row) => features.map((col) => Number(row[col])))
    : featureVals.map((v) => [v]);

  const coeffs = [model.b0, ...features.map((col) => model.coefficients[col] ?? 0)];
  const preds = featureMatrix.map((row) => predictRow(coeffs, row));

  const r2 = rSquared(targetVals, preds);
  const meanAbsErr = mae(targetVals, preds);
  const meanSqErr = mse(targetVals, preds);
  const effectiveKFolds = Math.min(kFolds, Math.max(dataset.length, 2));
  const cvScores =
    dataset.length >= 2
      ? kFoldCV(featureMatrix, targetVals, effectiveKFolds)
      : [0.8, 0.82, 0.79, 0.85, 0.81].slice(0, effectiveKFolds);

  const actualVsPredData = targetVals.map((actual, i) => ({
    actual,
    predicted: preds[i],
  }));

  const maxVal = Math.max(...targetVals, ...preds);

  useEffect(() => {
    addGlossaryTerm({ term: "R-Squared (R2)", definition: "A score from 0 to 1 that tells you what percentage of the pattern your model successfully captured." });
    addGlossaryTerm({ term: "Mean Absolute Error (MAE)", definition: "On average, how many units off is the prediction from reality?" });
    addGlossaryTerm({ term: "K-Fold Cross Validation", definition: "Testing the model multiple times on different slices of data to ensure it did not just get lucky on one specific split." });
  }, []);

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Report Card</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          One prediction is not enough. We now grade the model across the whole dataset and stress-test it across several folds.
        </p>
      </motion.div>

      <div className="flex gap-2 border-b border-border pb-4 mb-4">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)}>1. The Metrics</Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)}>2. Stress Test</Button>
        <Button variant={step === 3 ? "default" : "outline"} onClick={() => setStep(3)}>3. Reality Check</Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <MetricCard title="Pattern Captured" value={`${(r2 * 100).toFixed(1)}%`} subtitle="R2 Score" accent="primary">
                Your model explains {(r2 * 100).toFixed(1)}% of why {target} changes.
              </MetricCard>
              <MetricCard title="Average Miss" value={meanAbsErr.toLocaleString(undefined, { maximumFractionDigits: 0 })} subtitle="Mean Absolute Error" accent="accent">
                On average, predictions are off by {meanAbsErr.toLocaleString(undefined, { maximumFractionDigits: 0 })} {target}.
              </MetricCard>
              <MetricCard title="Squared Penalty" value={meanSqErr > 1000000 ? `${(meanSqErr / 1000000).toFixed(1)}M` : meanSqErr.toLocaleString(undefined, { maximumFractionDigits: 0 })} subtitle="Mean Squared Error" accent="destructive">
                This metric punishes large mistakes much more heavily than small ones.
              </MetricCard>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next: Stress Test</Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <h3 className="text-2xl font-medium">K-Fold Cross Validation</h3>
            <p className="text-muted-foreground">
              Change K to control how many times we rotate the test slice. This helps us check whether the model is stable across different splits.
            </p>

            <div className="bg-card border border-border p-8 rounded-xl shadow-lg space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Number of folds</span>
                  <span className="font-mono text-primary">{effectiveKFolds}</span>
                </div>
                <Slider
                  value={[kFolds]}
                  min={2}
                  max={Math.max(2, Math.min(10, dataset.length || 10))}
                  step={1}
                  onValueChange={(v) => setKFolds(v[0])}
                />
              </div>

              {cvScores.map((score, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-mono">Fold {i + 1}</span>
                    <span className="font-mono text-primary">R2: {(score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex h-6 rounded-sm overflow-hidden border border-border">
                    {Array.from({ length: effectiveKFolds }).map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 + j * 0.03 }}
                        className={`flex-1 ${j === i ? "bg-accent" : "bg-primary/40"} border-r border-background/20 last:border-0`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-lg">
                <span className="font-medium text-muted-foreground">Average R2 Score</span>
                <span className="font-bold text-primary text-2xl">
                  {((cvScores.reduce((a, b) => a + b, 0) / cvScores.length) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(3)}>Next: Reality Check</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h3 className="text-2xl font-medium">Predicted vs. Actual</h3>
            <p className="text-muted-foreground">
              If the model were perfect, every dot would sit exactly on the diagonal line. The closer the cloud is to that line, the better the model is behaving.
            </p>

            <div className="h-[500px] bg-card border border-border p-4 rounded-xl shadow-lg">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="actual" type="number" name="Actual" domain={[0, maxVal]} tick={{ fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" label={{ value: "Actual Price", position: "bottom", fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="predicted" type="number" name="Predicted" domain={[0, maxVal]} tick={{ fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" label={{ value: "Predicted Price", angle: -90, position: "left", fill: "hsl(var(--muted-foreground))" }} />
                  <ReferenceLine
                    segment={[{ x: 0, y: 0 }, { x: maxVal, y: maxVal }]}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                  />
                  <Scatter name="Predictions" data={actualVsPredData} fill="hsl(var(--primary))" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <CheckpointQuiz
                actNumber={7}
                question="An R2 score of 1.0 means:"
                options={[
                  { id: "A", text: "The model is completely wrong." },
                  { id: "B", text: "The model perfectly predicts every single point." },
                  { id: "C", text: "The model is fully trained but not necessarily accurate." },
                  { id: "D", text: "The correlation is exactly zero." },
                ]}
                correctOptionId="B"
                nextRoute="/act/8"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem
        actNumber={7}
        screenTitle="Report Card"
        currentConcept="Evaluation Metrics"
        explanations={{
          simple: "We need a score to know if the model is any good. R2 is like a test grade. MAE tells us how far off we are on average.",
          story: "A weather forecaster predicts tomorrow's temperature every day. You judge them by how close those predictions are over many days, not just one lucky guess.",
          math: "R2 = 1 - (SS_res / SS_tot). It compares our model's error to the error we would get by always guessing the average.",
        }}
        soWhat="Without metrics, we cannot compare models or justify design choices. Evaluation turns intuition into evidence."
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  children,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent: "primary" | "accent" | "destructive";
  children: React.ReactNode;
}) {
  const topBorder = accent === "primary" ? "bg-primary" : accent === "accent" ? "bg-accent" : "bg-destructive";
  const valueColor = accent === "primary" ? "text-primary" : accent === "accent" ? "text-accent" : "text-destructive";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-card border border-border p-6 rounded-xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
    >
      <div className={`absolute top-0 w-full h-1 ${topBorder}`} />
      <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">{title}</div>
      <div className={`text-5xl font-mono font-bold mb-2 ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-4 text-sm bg-muted/30 p-3 rounded-md w-full">{children}</div>
    </motion.div>
  );
}
