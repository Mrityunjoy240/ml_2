import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { Trophy } from "lucide-react";
import { predictRow } from "@/lib/math";

export default function Act6Prediction() {
  const { dataset, targetColumn, featureColumns, model, userGuess } = useAppState();
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [hasPredicted, setHasPredicted] = useState(false);

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";
  const features = featureColumns.length ? featureColumns : [feature];
  const firstSample = dataset[0] ?? { [feature]: 1850, [target]: 320000 };

  const actualHouse =
    dataset.find((row) => Math.abs(Number(row[feature]) - 1850) < 100) ||
    ({ [feature]: 1850, [target]: 320000 } as Record<string, number>);
  const actualPrice = Number(actualHouse[target]);

  const values = features.map((col) => inputValues[col] ?? Number(firstSample[col]) ?? 0);
  const coeffs = [model.b0, ...features.map((col) => model.coefficients[col] ?? 0)];
  const predictedPrice = predictRow(coeffs, values);

  const guessDiff = Math.abs((userGuess || 0) - actualPrice);
  const modelDiff = Math.abs(predictedPrice - actualPrice);
  const modelWon = modelDiff < guessDiff;

  const handlePredict = () => setHasPredicted(true);

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Prediction</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          The moment of truth. We now plug a new sample into the trained equation and compute the prediction term by term.
        </p>
      </motion.div>

      <div className="bg-card border border-border p-6 md:p-8 rounded-xl shadow-lg">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
          <div className="space-y-6">
            <h3 className="text-2xl font-medium mb-2">Enter a new sample</h3>
            <div className="space-y-3">
              {features.map((col) => (
                <div key={col} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <Input
                    type="number"
                    value={inputValues[col] ?? Number(firstSample[col]) ?? ""}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, [col]: Number(e.target.value) }))
                    }
                    disabled={hasPredicted}
                    className="h-12 text-lg md:text-xl font-mono"
                  />
                  <span className="text-muted-foreground font-medium sm:min-w-24">{col}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={handlePredict} disabled={hasPredicted}>
              Run Prediction
            </Button>
          </div>

          <div className="bg-muted/20 p-6 rounded-lg border border-border font-mono space-y-4 relative overflow-hidden">
            <div className="text-sm text-muted-foreground mb-4">Calculation</div>
            <div className="flex justify-between items-center text-lg">
              <span>Intercept (b0)</span>
              <span>{model.b0.toFixed(2)}</span>
            </div>
            {features.map((col, i) => (
              <div key={col} className="flex justify-between items-center text-lg gap-4">
                <span>{col} coefficient x value</span>
                <span>{((model.coefficients[col] ?? 0) * values[i]).toFixed(2)}</span>
              </div>
            ))}
            <div className="w-full h-px bg-border my-2" />
            <div className="flex justify-between items-center text-2xl font-bold text-primary">
              <span>Prediction</span>
              <span>{hasPredicted ? `$${predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hasPredicted && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="space-y-8"
          >
            <h3 className="text-3xl font-serif text-center mb-8">The Reveal</h3>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className={`p-6 rounded-xl border ${!modelWon ? "bg-accent/10 border-accent/30" : "bg-card border-border"}`}
              >
                <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Your Guess</div>
                <div className={`text-3xl font-mono ${!modelWon ? "text-accent font-bold" : ""}`}>
                  ${(userGuess || 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  Off by: ${guessDiff.toLocaleString()}
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Actual Price</div>
                <div className="text-4xl font-mono text-foreground font-bold">
                  ${actualPrice.toLocaleString()}
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 3.5 }}
                className={`p-6 rounded-xl border ${modelWon ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}
              >
                <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Model Prediction</div>
                <div className={`text-3xl font-mono ${modelWon ? "text-primary font-bold" : ""}`}>
                  ${predictedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  Off by: ${modelDiff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5 }}
              className="flex justify-center"
            >
              <div className="flex flex-col items-center gap-3 text-center bg-muted/50 border border-border px-6 py-4 rounded-3xl sm:flex-row sm:text-left text-lg">
                <Trophy className={`w-6 h-6 ${modelWon ? "text-primary" : "text-accent"}`} />
                <span>{modelWon ? "The model used the pattern more effectively than the original guess." : "Your intuition was closer on this example."}</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }}>
              <CheckpointQuiz
                actNumber={6}
                question="During prediction, what do we plug into the equation?"
                options={[
                  { id: "A", text: "The actual target value" },
                  { id: "B", text: "The new feature values for the sample we want to evaluate" },
                  { id: "C", text: "The model's past errors" },
                  { id: "D", text: "Only the intercept" },
                ]}
                correctOptionId="B"
                nextRoute="/act/7"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem
        actNumber={6}
        screenTitle="Prediction"
        currentConcept="Inference"
        explanations={{
          simple: "We plug the new numbers into the formula we learned and add up each term.",
          story: "Think of a scorecard. Each feature contributes some amount, and the final prediction is the total score.",
          math: "We evaluate h(x) = b0 + b1x1 + b2x2 + ... for one new sample.",
        }}
        soWhat="A model is only useful if it can handle new data. Prediction is where the learned pattern becomes practical."
      />
    </div>
  );
}
