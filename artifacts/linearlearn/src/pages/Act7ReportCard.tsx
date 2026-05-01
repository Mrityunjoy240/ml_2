import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { rSquared, mae, mse, kFoldCV } from "@/lib/math";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function Act7ReportCard() {
  const { dataset, targetColumn, featureColumns, model, addGlossaryTerm } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";
  
  const featureVals = dataset.length ? dataset.map(r => Number(r[feature])) : [1000, 2000];
  const targetVals = dataset.length ? dataset.map(r => Number(r[target])) : [200000, 300000];
  
  const preds = featureVals.map(x => model.b0 + model.b1 * x);
  
  const r2 = rSquared(targetVals, preds);
  const meanAbsErr = mae(targetVals, preds);
  const meanSqErr = mse(targetVals, preds);

  // K-Fold CV (5 folds)
  const X_2d = featureVals.map(x => [x]);
  const cvScores = dataset.length >= 5 ? kFoldCV(X_2d, targetVals, 5) : [0.8, 0.82, 0.79, 0.85, 0.81];

  const actualVsPredData = targetVals.map((actual, i) => ({
      actual,
      predicted: preds[i]
  }));

  const maxVal = Math.max(...targetVals, ...preds);

  useEffect(() => {
    addGlossaryTerm({ term: "R-Squared (R²)", definition: "A score from 0 to 1 that tells you what percentage of the pattern your model successfully captured." });
    addGlossaryTerm({ term: "Mean Absolute Error (MAE)", definition: "On average, how many units off is the prediction from reality?" });
    addGlossaryTerm({ term: "K-Fold Cross Validation", definition: "Testing the model multiple times on different slices of data to ensure it didn't just get lucky on one specific test set." });
  }, []);

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Report Card</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          We made one prediction, but how good is the model overall? Let's look at the grades.
        </p>
      </motion.div>

      <div className="flex gap-2 border-b border-border pb-4 mb-4">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)}>1. The Metrics</Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)}>2. Stress Test (K-Fold)</Button>
        <Button variant={step === 3 ? "default" : "outline"} onClick={() => setStep(3)}>3. Reality Check</Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border p-6 rounded-xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
                    >
                        <div className="absolute top-0 w-full h-1 bg-primary" />
                        <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">Pattern Captured</div>
                        <div className="text-5xl font-mono text-primary font-bold mb-2">{(r2 * 100).toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">R² Score</div>
                        <div className="mt-4 text-sm bg-muted/30 p-3 rounded-md w-full">
                            Your model explains {(r2 * 100).toFixed(1)}% of why {target} changes.
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border p-6 rounded-xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
                    >
                        <div className="absolute top-0 w-full h-1 bg-accent" />
                        <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">Average Miss</div>
                        <div className="text-5xl font-mono text-accent font-bold mb-2">{meanAbsErr.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        <div className="text-xs text-muted-foreground">Mean Absolute Error</div>
                        <div className="mt-4 text-sm bg-muted/30 p-3 rounded-md w-full">
                            On average, predictions are off by {meanAbsErr.toLocaleString(undefined, {maximumFractionDigits: 0})} {target}.
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border p-6 rounded-xl flex flex-col items-center text-center shadow-lg relative overflow-hidden"
                    >
                        <div className="absolute top-0 w-full h-1 bg-destructive" />
                        <div className="text-sm text-muted-foreground uppercase tracking-widest mb-4">Squared Penalty</div>
                        <div className="text-5xl font-mono text-destructive font-bold mb-2">{meanSqErr > 1000000 ? (meanSqErr / 1000000).toFixed(1) + 'M' : meanSqErr.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        <div className="text-xs text-muted-foreground">Mean Squared Error</div>
                        <div className="mt-4 text-sm bg-muted/30 p-3 rounded-md w-full">
                            Punishes large mistakes much more heavily than small ones.
                        </div>
                    </motion.div>
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
                    Did we just get lucky with our Train/Test split? Let's chop the data into 5 slices, and train 5 separate models, rotating which slice is the test set.
                </p>

                <div className="bg-card border border-border p-8 rounded-xl shadow-lg space-y-6">
                    {cvScores.map((score, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground font-mono">Fold {i+1}</span>
                                <span className="font-mono text-primary">R²: {(score * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex h-6 rounded-sm overflow-hidden border border-border">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <motion.div 
                                        key={j}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.2 + j * 0.05 }}
                                        className={`flex-1 ${j === i ? 'bg-accent' : 'bg-primary/40'} border-r border-background/20 last:border-0`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <div className="mt-8 pt-4 border-t border-border flex justify-between items-center text-lg">
                        <span className="font-medium text-muted-foreground">Average R² Score:</span>
                        <span className="font-bold text-primary text-2xl">
                            {((cvScores.reduce((a,b)=>a+b,0) / cvScores.length) * 100).toFixed(1)}%
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
                    The ultimate visual test. If the model was perfect, every dot would fall exactly on the diagonal line.
                </p>

                <div className="h-[500px] bg-card border border-border p-4 rounded-xl shadow-lg">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="actual" type="number" name="Actual" domain={[0, maxVal]} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" label={{ value: "Actual Price", position: "bottom", fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis dataKey="predicted" type="number" name="Predicted" domain={[0, maxVal]} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" label={{ value: "Predicted Price", angle: -90, position: "left", fill: 'hsl(var(--muted-foreground))' }} />
                            
                            <ReferenceLine 
                                segment={[ {x: 0, y: 0}, {x: maxVal, y: maxVal} ]}
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
                        question="An R² score of 1.0 (or 100%) means:"
                        options={[
                            { id: "A", text: "The model is completely wrong." },
                            { id: "B", text: "The model perfectly predicts every single point." },
                            { id: "C", text: "The model is 100% finished training." },
                            { id: "D", text: "The correlation is exactly zero." }
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
          simple: "We need a score to know if the model is good. R² is like a test grade (0 to 100%). MAE is how many dollars we are off by.",
          story: "A weather forecaster says it's going to be 70 degrees. It's actually 75. Their error is 5 degrees. We average those errors over the year.",
          math: "R² = 1 - (SS_res / SS_tot). It compares our model's error to the error we'd get if we just guessed the average every time."
        }}
        soWhat="Without metrics, we can't compare two different models. If someone else builds a model with more features, we use these numbers to prove which one is better."
      />
    </div>
  );
}
