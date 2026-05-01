import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { WorksheetEngine } from "@/components/WorksheetEngine";
import { mean, mse, normalEquation, gradientDescent } from "@/lib/math";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";

export default function Act4TheMath() {
  const { dataset, targetColumn, featureColumns, addGlossaryTerm } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Default fallback if no data
  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";
  
  const featureVals = dataset.map(r => Number(r[feature])) || [1000, 2000, 3000];
  const targetVals = dataset.map(r => Number(r[target])) || [200000, 300000, 400000];
  
  const scatterData = featureVals.map((f, i) => ({ x: f, y: targetVals[i] }));
  
  const [b0, setB0] = useState(0);
  const [b1, setB1] = useState(0);
  const [currentMse, setCurrentMse] = useState(0);

  const [gdHistory, setGdHistory] = useState<{b0: number, b1: number, loss: number}[]>([]);
  const [gdStep, setGdStep] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    // Initial naive guess
    const meanX = mean(featureVals);
    const meanY = mean(targetVals);
    if (!featureVals.length) return;
    setB0(meanY);
    setB1(0);
  }, [dataset, featureVals.length]);

  useEffect(() => {
    if (!featureVals.length) return;
    const preds = featureVals.map(x => b0 + b1 * x);
    setCurrentMse(mse(targetVals, preds));
  }, [b0, b1, featureVals, targetVals]);

  const fMin = Math.min(...(featureVals.length ? featureVals : [0]));
  const fMax = Math.max(...(featureVals.length ? featureVals : [100]));
  
  const tMin = Math.min(...(targetVals.length ? targetVals : [0]));
  const tMax = Math.max(...(targetVals.length ? targetVals : [100]));

  const actualCoeffs = featureVals.length ? normalEquation(featureVals.map(x => [x]), targetVals) : [0, 0];

  const handleOptimize = () => {
    setIsOptimizing(true);
    
    // Animate b0 and b1 to actualCoeffs over a few steps
    const steps = 30;
    const history: { b0: number; b1: number; loss: number }[] = [];
    const startB0 = b0;
    const startB1 = b1;
    const endB0 = actualCoeffs[0];
    const endB1 = actualCoeffs[1];

    for(let i=0; i<=steps; i++) {
        const progress = i / steps;
        // Ease out quad
        const ease = 1 - (1 - progress) * (1 - progress);
        const currB0 = startB0 + (endB0 - startB0) * ease;
        const currB1 = startB1 + (endB1 - startB1) * ease;
        const preds = featureVals.map(x => currB0 + currB1 * x);
        const loss = mse(targetVals, preds);
        history.push({ b0: currB0, b1: currB1, loss });
    }
    
    setGdHistory(history);
    setGdStep(0);

    let currentStep = 0;
    const interval = setInterval(() => {
        if(currentStep >= steps) {
            clearInterval(interval);
            setIsOptimizing(false);
            setB0(endB0);
            setB1(endB1);
            return;
        }
        setB0(history[currentStep].b0);
        setB1(history[currentStep].b1);
        setGdStep(currentStep);
        currentStep++;
    }, 50);
  };

  if (step >= 2) {
    addGlossaryTerm({ term: "Intercept (b₀)", definition: "The starting value. If the feature was 0, what would the prediction be?" });
    addGlossaryTerm({ term: "Slope (b₁)", definition: "The multiplier. For every 1 unit increase in the feature, how much does the prediction change?" });
    addGlossaryTerm({ term: "Mean Squared Error (MSE)", definition: "A way to measure how wrong a line is. It takes the distance from each point to the line, squares it, and averages them." });
  }
  if (step >= 3) {
    addGlossaryTerm({ term: "Gradient Descent", definition: "An algorithm that takes small steps down the 'hill' of errors to find the best possible line." });
  }

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">The Math</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          It's time to build the formula. We need to find the perfect starting point and multiplier to draw our trend line.
        </p>
      </motion.div>

      <div className="flex gap-2 border-b border-border pb-4 mb-4 flex-wrap">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)}>1. The Equation</Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)}>2. The Error</Button>
        <Button variant={step === 3 ? "default" : "outline"} onClick={() => setStep(3)}>3. Gradient Descent</Button>
        <Button variant={step === 4 ? "default" : "outline"} onClick={() => setStep(4)}>4. Normal Equation</Button>
        <Button variant={step === 5 ? "default" : "outline"} onClick={() => setStep(5)}>5. Pen & Paper</Button>
      </div>

      <AnimatePresence mode="wait">
        {(step === 1 || step === 2 || step === 3) && (
          <motion.div key="chart-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-8">
            
            <div className="space-y-6">
                <div className="h-[400px] bg-card border border-border p-4 rounded-xl shadow-lg relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="x" type="number" domain={['auto', 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                            <YAxis dataKey="y" type="number" domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                            <Scatter name="Data" data={scatterData} fill="hsl(var(--muted-foreground))" opacity={0.6} />
                            <ReferenceLine 
                                segment={[
                                    { x: fMin, y: b0 + b1 * fMin },
                                    { x: fMax, y: b0 + b1 * fMax }
                                ]} 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={3} 
                            />
                            {/* Error lines for step 2 */}
                            {step >= 2 && scatterData.slice(0, 20).map((pt, i) => {
                                const predY = b0 + b1 * pt.x;
                                return (
                                    <ReferenceLine 
                                        key={i}
                                        segment={[ { x: pt.x, y: pt.y }, { x: pt.x, y: predY } ]}
                                        stroke="hsl(var(--destructive))"
                                        strokeWidth={1}
                                        strokeDasharray="2 2"
                                    />
                                );
                            })}
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                
                {step >= 2 && (
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
                        <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Total Error (MSE)</div>
                        <motion.div 
                            key={currentMse}
                            initial={{ scale: 1.1, color: "hsl(var(--destructive))" }}
                            animate={{ scale: 1, color: "hsl(var(--foreground))" }}
                            className="text-4xl font-mono font-medium"
                        >
                            {Math.round(currentMse).toLocaleString()}
                        </motion.div>
                    </div>
                )}
            </div>

            <div className="space-y-8">
              {step === 1 && (
                  <div className="space-y-6">
                      <h3 className="text-2xl font-medium">The Formula of a Line</h3>
                      <div className="bg-muted/30 p-6 rounded-xl font-mono text-xl border border-border text-center">
                          y = <span className="text-accent">b₀</span> + <span className="text-primary">b₁</span>x
                      </div>
                      <p className="text-muted-foreground">Every straight line is defined by two numbers. The starting point (b₀) and the slope (b₁).</p>
                      
                      <div className="space-y-8 pt-4">
                          <div className="space-y-4">
                              <div className="flex justify-between">
                                  <label className="font-medium text-accent">b₀ (Starting point)</label>
                                  <span className="font-mono">{b0.toFixed(0)}</span>
                              </div>
                              <Slider value={[b0]} min={tMin - (tMax-tMin)} max={tMax} step={(tMax-tMin)/100} onValueChange={v => setB0(v[0])} />
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex justify-between">
                                  <label className="font-medium text-primary">b₁ (Multiplier)</label>
                                  <span className="font-mono">{b1.toFixed(2)}</span>
                              </div>
                              <Slider value={[b1]} min={-500} max={500} step={1} onValueChange={v => setB1(v[0])} />
                          </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => setStep(2)}>Next: Measuring Error</Button>
                  </div>
              )}

              {step === 2 && (
                  <div className="space-y-6">
                      <h3 className="text-2xl font-medium">Measuring Mistakes</h3>
                      <p className="text-muted-foreground">
                          The red dashed lines show how far off our prediction is from reality. 
                          We square these distances and average them to get the Mean Squared Error (MSE).
                      </p>
                      <p className="text-muted-foreground">
                          Try adjusting the sliders. Can you make the MSE as small as possible?
                      </p>

                      <div className="space-y-8 pt-4">
                          <div className="space-y-4">
                              <div className="flex justify-between">
                                  <label className="font-medium text-accent">b₀</label>
                                  <span className="font-mono">{b0.toFixed(0)}</span>
                              </div>
                              <Slider value={[b0]} min={tMin - (tMax-tMin)} max={tMax} step={(tMax-tMin)/100} onValueChange={v => setB0(v[0])} />
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex justify-between">
                                  <label className="font-medium text-primary">b₁</label>
                                  <span className="font-mono">{b1.toFixed(2)}</span>
                              </div>
                              <Slider value={[b1]} min={-500} max={500} step={1} onValueChange={v => setB1(v[0])} />
                          </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => setStep(3)}>Next: Let the computer do it</Button>
                  </div>
              )}

              {step === 3 && (
                  <div className="space-y-6">
                      <h3 className="text-2xl font-medium">Gradient Descent</h3>
                      <p className="text-muted-foreground">
                          Guessing and checking is slow. The computer uses calculus to figure out exactly which direction to move the sliders to decrease the error.
                      </p>

                      <div className="p-6 bg-card border border-border rounded-xl">
                          <div className="flex justify-between mb-4">
                              <span className="text-muted-foreground">Iteration</span>
                              <span className="font-mono">{gdStep}</span>
                          </div>
                          <Button size="lg" className="w-full" onClick={handleOptimize} disabled={isOptimizing}>
                              {isOptimizing ? "Optimizing..." : "Run Gradient Descent"}
                          </Button>
                      </div>

                      {gdHistory.length > 0 && (
                          <div className="h-[150px] w-full mt-4">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={gdHistory.slice(0, gdStep + 1)}>
                                      <XAxis dataKey="name" hide />
                                      <YAxis domain={['auto', 'auto']} hide />
                                      <Line type="monotone" dataKey="loss" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} isAnimationActive={false} />
                                  </LineChart>
                              </ResponsiveContainer>
                              <div className="text-center text-sm text-muted-foreground mt-2">Loss dropping over time</div>
                          </div>
                      )}

                      {!isOptimizing && gdHistory.length > 0 && (
                          <Button className="w-full" onClick={() => setStep(4)}>Next: The Exact Answer</Button>
                      )}
                  </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
              <h3 className="text-3xl font-serif font-medium text-center">The Normal Equation</h3>
              <p className="text-center text-muted-foreground text-lg">
                  For small datasets, we don't even need to step down the hill. We can jump straight to the bottom using one exact formula.
              </p>

              <div className="bg-card border border-border rounded-xl p-8 space-y-8">
                  <div className="text-center space-y-4">
                      <h4 className="text-sm uppercase tracking-widest text-primary font-medium">The Multiplier (Slope)</h4>
                      <div className="font-mono text-2xl bg-muted/30 p-4 rounded-lg inline-block border border-border">
                          b₁ = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
                      </div>
                      <div className="text-muted-foreground">How much X and Y vary together, divided by how much X varies alone.</div>
                      <div className="text-xl font-mono text-accent pt-2">Calculated: {actualCoeffs[1].toFixed(2)}</div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <div className="text-center space-y-4">
                      <h4 className="text-sm uppercase tracking-widest text-primary font-medium">The Starting Point (Intercept)</h4>
                      <div className="font-mono text-2xl bg-muted/30 p-4 rounded-lg inline-block border border-border">
                          b₀ = ȳ - b₁x̄
                      </div>
                      <div className="text-muted-foreground">The average Y minus the part of Y explained by the average X.</div>
                      <div className="text-xl font-mono text-accent pt-2">Calculated: {actualCoeffs[0].toFixed(2)}</div>
                  </div>
              </div>
              <div className="flex justify-end">
                  <Button onClick={() => setStep(5)}>Next: Step by Step</Button>
              </div>
          </motion.div>
        )}

        {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h3 className="text-3xl font-serif font-medium">Pen & Paper Walkthrough</h3>
                <p className="text-muted-foreground">Here is the exact calculation using the first 3 rows of your data.</p>
                
                <div className="bg-card border border-border rounded-xl p-8 font-mono text-sm leading-relaxed space-y-6 overflow-x-auto">
                    <div>
                        <div className="text-primary mb-2">// 1. The Data (First 3 rows)</div>
                        {dataset.slice(0,3).map((r, i) => (
                            <div key={i}>x{i+1} = {r[feature]}, y{i+1} = {r[target]}</div>
                        ))}
                    </div>

                    <div>
                        <div className="text-primary mb-2">// 2. Calculate Means (Averages)</div>
                        <div>x̄ = ({dataset.slice(0,3).map(r => r[feature]).join(' + ')}) / 3 = {(featureVals.slice(0,3).reduce((a,b)=>a+b,0)/3).toFixed(2)}</div>
                        <div>ȳ = ({dataset.slice(0,3).map(r => r[target]).join(' + ')}) / 3 = {(targetVals.slice(0,3).reduce((a,b)=>a+b,0)/3).toFixed(2)}</div>
                    </div>

                    <div>
                        <div className="text-primary mb-2">// 3. Differences from Mean</div>
                        <div>We calculate (x - x̄) and (y - ȳ) for each row, multiply them, and sum them up.</div>
                        <div className="text-muted-foreground italic mt-2">This is the numerator of b₁.</div>
                    </div>

                    <div>
                        <div className="text-primary mb-2">// 4. Final Coefficients</div>
                        <div>b₁ = {actualCoeffs[1].toFixed(4)}</div>
                        <div>b₀ = {actualCoeffs[0].toFixed(4)}</div>
                    </div>

                    <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="text-foreground">Final Model:</div>
                        <div className="text-xl text-accent mt-2">Prediction = {actualCoeffs[0].toFixed(2)} + {actualCoeffs[1].toFixed(2)} * {feature}</div>
                    </div>
                </div>
                <WorksheetEngine dataset={dataset} feature={feature} target={target} />

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CheckpointQuiz 
                    actNumber={4}
                    question="What is the goal of Gradient Descent?"
                    options={[
                      { id: "A", text: "To maximize the correlation" },
                      { id: "B", text: "To step towards the lowest possible Mean Squared Error" },
                      { id: "C", text: "To eliminate all outliers" },
                      { id: "D", text: "To divide the data into training and testing sets" }
                    ]}
                    correctOptionId="B"
                    nextRoute="/act/5"
                  />
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem 
        actNumber={4}
        screenTitle="The Math"
        currentConcept="Coefficients and MSE"
        explanations={{
          simple: "We draw a line. We measure how much it missed the dots. We adjust the line to miss the dots less. That's it.",
          story: "Imagine tuning a radio dial. You turn it a bit, the static gets worse (error goes up). You turn it the other way, the music gets clearer. You stop when it's clearest.",
          math: "We are finding the parameters θ that minimize the cost function J(θ) = 1/2m Σ(h_θ(x) - y)^2 using partial derivatives."
        }}
        soWhat="Without a mathematical way to define 'error', we have no way to program a computer to find the 'best' line. MSE gives the computer a scoreboard."
      />
    </div>
  );
}
