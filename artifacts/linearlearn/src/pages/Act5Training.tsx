import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { trainTestSplit, normalEquation, mse, mean, predictRow } from "@/lib/math";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

export default function Act5Training() {
  const { dataset, targetColumn, featureColumns, setModel, model, addGlossaryTerm } = useAppState();
  const [step, setStep] = useState<1 | 2>(1);
  const [splitRatio, setSplitRatio] = useState(0.7);
  const [trainData, setTrainData] = useState<any[]>([]);
  const [testData, setTestData] = useState<any[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<{ epoch: number; loss: number }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trained, setTrained] = useState(false);

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";
  const features = featureColumns.length ? featureColumns : [feature];

  useEffect(() => {
    if (!dataset.length) return;
    const { train, test } = trainTestSplit(dataset, splitRatio);
    setTrainData(train);
    setTestData(test);
  }, [dataset, splitRatio]);

  useEffect(() => {
    addGlossaryTerm({ term: "Training Set", definition: "The portion of data we use to teach the model. Like practice exams." });
    addGlossaryTerm({ term: "Test Set", definition: "The portion of data we hide from the model until the very end, to test if it actually learned or just memorized." });
  }, []);

  const handleTrain = () => {
    if (!trainData.length) return;
    setIsTraining(true);

    const epochs = 50;
    const history: { epoch: number; loss: number }[] = [];
    const featureMatrix = trainData.map((row) => features.map((col) => Number(row[col])));
    const targetVals = trainData.map((row) => Number(row[target]));
    const finalCoeffs = normalEquation(featureMatrix, targetVals);
    const initialCoeffs = [mean(targetVals), ...features.map(() => 0)];

    for (let i = 0; i <= epochs; i++) {
      const progress = i / epochs;
      const coeffs = finalCoeffs.map(
        (value, idx) => initialCoeffs[idx] + (value - initialCoeffs[idx]) * progress,
      );
      const preds = featureMatrix.map((row) => predictRow(coeffs, row));
      history.push({ epoch: i, loss: mse(targetVals, preds) });
    }

    let currentEpoch = 0;
    const interval = setInterval(() => {
      if (currentEpoch > epochs) {
        clearInterval(interval);
        setIsTraining(false);
        setTrained(true);
        setModel({
          b0: finalCoeffs[0] ?? 0,
          b1: finalCoeffs[1] ?? 0,
          coefficients: Object.fromEntries(
            features.map((col, i) => [col, finalCoeffs[i + 1] ?? 0]),
          ),
        });
        return;
      }
      setTrainingHistory(history.slice(0, currentEpoch + 1));
      currentEpoch++;
    }, 50);
  };

  const equationText = `${model.b0.toFixed(2)} ${features
    .map((col) => `+ (${(model.coefficients[col] ?? 0).toFixed(4)} x ${col})`)
    .join(" ")}`;

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Training</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          We have our formula. Now we need to teach it, but we also need a way to test if it actually learned anything useful.
        </p>
      </motion.div>

      <div className="flex gap-2 border-b border-border pb-4 mb-4">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)}>1. The Split</Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)}>2. The Training</Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <h3 className="text-2xl font-medium">Train / Test Split</h3>
            <p className="text-muted-foreground">
              If we use all our data to build the model, we will not have any unseen data to test it on.
              We split the data. The blue squares are for learning. The amber squares are hidden for the final test.
            </p>

            <div className="bg-card border border-border p-8 rounded-xl shadow-lg space-y-8">
              <div className="flex justify-between items-center">
                <span className="font-mono text-primary">{Math.round(splitRatio * 100)}% Train</span>
                <span className="font-mono text-accent">{Math.round((1 - splitRatio) * 100)}% Test</span>
              </div>
              <Slider value={[splitRatio]} min={0.1} max={0.9} step={0.1} onValueChange={(v) => setSplitRatio(v[0])} />

              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: 100 }).map((_, i) => {
                  const isTrain = i < splitRatio * 100;
                  return (
                    <motion.div
                      key={i}
                      layout
                      className={`w-6 h-6 rounded-sm ${isTrain ? "bg-primary" : "bg-accent"} opacity-80`}
                    />
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="border border-border rounded-lg p-4">Train rows: {trainData.length}</div>
                <div className="border border-border rounded-lg p-4">Test rows: {testData.length}</div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>Next: Train Model</Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h3 className="text-2xl font-medium">The Final Run</h3>
            <p className="text-muted-foreground">
              We now fit the model using {features.length === 1 ? "one feature" : `${features.length} features`}.
              The loss curve shows the model settling into a lower-error solution over time.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col justify-center items-center space-y-6">
                <Button size="lg" onClick={handleTrain} disabled={isTraining || trained}>
                  {isTraining ? "Training..." : trained ? "Training Complete" : "Start Training"}
                </Button>

                {trainingHistory.length > 0 && (
                  <div className="w-full h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingHistory}>
                        <XAxis dataKey="epoch" hide />
                        <YAxis domain={["auto", "auto"]} hide />
                        <Line type="monotone" dataKey="loss" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {trained && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-card border border-primary/50 rounded-xl p-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-lg">
                      Model Ready
                    </div>
                    <h4 className="text-xl font-medium mb-6">Model Card</h4>
                    <div className="space-y-4 font-mono">
                      <div>
                        <span className="text-muted-foreground">Intercept (b0):</span>
                        <div className="text-2xl text-accent">{model.b0.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Feature coefficients:</span>
                        <div className="mt-3 space-y-2 text-base text-primary">
                          {features.map((col) => (
                            <div key={col} className="flex justify-between gap-4">
                              <span>{col}</span>
                              <span>{(model.coefficients[col] ?? 0).toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-8 pt-4 border-t border-border">
                        <div className="text-sm text-muted-foreground mb-2">Final Equation</div>
                        <div className="text-lg break-words">
                          Predicted {target} = <br />
                          {equationText}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {trained && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckpointQuiz
                  actNumber={5}
                  question="Why do we hold back a 'Test Set'?"
                  options={[
                    { id: "A", text: "To make the math faster" },
                    { id: "B", text: "To evaluate if the model actually learned the pattern or just memorized the training data" },
                    { id: "C", text: "Because 100% of data is too much" },
                    { id: "D", text: "To increase the MSE" },
                  ]}
                  correctOptionId="B"
                  nextRoute="/act/6"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem
        actNumber={5}
        screenTitle="Training"
        currentConcept="Train/Test Split"
        explanations={{
          simple: "If you give a student the test questions to study with, they might score 100% without really learning. The test set is the unseen exam.",
          story: "A chef tastes their own soup while cooking. The real test is when a customer tastes it for the first time.",
          math: "We optimize theta on X_train, then evaluate the generalization error J(theta) on X_test.",
        }}
        soWhat="A model that perfectly predicts data it has already seen is useless in the real world. Generalization to new data is the entire point of machine learning."
      />
    </div>
  );
}
