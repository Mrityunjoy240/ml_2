import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { pearsonCorrelation, mean, max, min, stdDev } from "@/lib/math";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";

export default function Act3ReadingClues() {
  const { dataset, targetColumn, featureColumns, addGlossaryTerm } = useAppState();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userLine, setUserLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showActualLine, setShowActualLine] = useState(false);
  const drawAreaRef = useRef<HTMLDivElement>(null);

  // Default to first feature
  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";

  if (!dataset.length || !feature || !target) {
    return <div className="p-8 text-center text-muted-foreground">Please complete Act 2 to load data.</div>;
  }

  // Pre-compute values
  const featureVals = dataset.map(r => Number(r[feature]));
  const targetVals = dataset.map(r => Number(r[target]));
  
  const fMin = min(featureVals);
  const fMax = max(featureVals);
  const tMin = min(targetVals);
  const tMax = max(targetVals);
  
  const pearson = pearsonCorrelation(featureVals, targetVals);

  // Histogram data
  const bins = 10;
  const binWidth = (fMax - fMin) / bins;
  const histogramData = Array.from({ length: bins }, (_, i) => {
    const binStart = fMin + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = featureVals.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;
    return { name: `${Math.round(binStart)}-${Math.round(binEnd)}`, count };
  });

  const scatterData = dataset.map(r => ({ x: Number(r[feature]), y: Number(r[target]) }));

  // Add glossary terms
  if (step >= 2) {
    addGlossaryTerm({ term: "Correlation", definition: "A measure from -1 to 1 showing how strongly two variables are related. Positive means they go up together. Negative means as one goes up, the other goes down." });
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showActualLine) return;
    if (!drawAreaRef.current) return;
    const rect = drawAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setUserLine({ start: { x, y }, end: { x, y } });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !userLine) return;
    if (!drawAreaRef.current) return;
    const rect = drawAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setUserLine({ ...userLine, end: { x, y } });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Reading Clues</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Before we predict the future, we need to understand the present. Let's look at the shape of our data.
        </p>
      </motion.div>

      <div className="flex gap-2 border-b border-border pb-4 mb-4">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => setStep(1)}>1. Shape</Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => setStep(2)}>2. Trend</Button>
        <Button variant={step === 3 ? "default" : "outline"} onClick={() => setStep(3)}>3. Strength</Button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <h3 className="text-2xl font-medium">The Shape of {feature}</h3>
            <p className="text-muted-foreground">Most of our data clumps together in the middle. Extreme values are rare.</p>
            
            <div className="h-[400px] bg-card border border-border p-4 rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--border))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis stroke="hsl(var(--border))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                    {histogramData.map((entry, index) => (
                      <motion.rect
                        key={`cell-${index}`}
                        initial={{ y: 400, height: 0 }}
                        animate={{ y: 0, height: "100%" }} // Recharts handles actual heights, this is just for entrance if we customized the shape, but simple bar animation is handled by recharts default. We'll rely on recharts default animation here for bars.
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next: Find the Trend</Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <h3 className="text-2xl font-medium">Draw the Trend</h3>
            <p className="text-muted-foreground">Click and drag to draw a line that you think best fits this data.</p>
            
            <div className="relative h-[500px] bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="x" type="number" domain={['auto', 'auto']} name={feature} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <YAxis dataKey="y" type="number" domain={['auto', 'auto']} name={target} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <Scatter name="Data" data={scatterData} fill="hsl(var(--muted-foreground))" opacity={0.6} />
                  {showActualLine && (
                     <ReferenceLine 
                       stroke="hsl(var(--accent))" 
                       strokeWidth={3} 
                       segment={[
                         { x: fMin, y: fMin * (pearson * stdDev(targetVals) / stdDev(featureVals)) + (mean(targetVals) - (pearson * stdDev(targetVals) / stdDev(featureVals)) * mean(featureVals)) },
                         { x: fMax, y: fMax * (pearson * stdDev(targetVals) / stdDev(featureVals)) + (mean(targetVals) - (pearson * stdDev(targetVals) / stdDev(featureVals)) * mean(featureVals)) }
                       ]} 
                     />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Drawing overlay */}
              <div 
                ref={drawAreaRef}
                className="absolute inset-0 z-10 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {userLine && (
                  <svg className="w-full h-full pointer-events-none">
                    <line 
                      x1={userLine.start.x} 
                      y1={userLine.start.y} 
                      x2={userLine.end.x} 
                      y2={userLine.end.y} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4} 
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border">
              {!showActualLine ? (
                <>
                  <span className="text-muted-foreground">Draw a line to continue.</span>
                  <Button onClick={() => setShowActualLine(true)} disabled={!userLine}>Reveal Actual Trend</Button>
                </>
              ) : (
                <>
                  <div className="text-lg">
                    Pearson Correlation: <span className="font-mono text-accent font-bold">{pearson.toFixed(2)}</span>
                  </div>
                  <Button onClick={() => setStep(3)}>Next: Correlation</Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h3 className="text-2xl font-medium">The Pull of Correlation</h3>
            <p className="text-muted-foreground">Correlation is like a magnet. 1.0 is a perfect positive pull. -1.0 is a perfect negative pull. 0 means no pull at all.</p>
            
            <div className="bg-card border border-border rounded-xl p-8 space-y-12">
              <div className="space-y-4">
                <div className="flex justify-between font-mono text-sm">
                  <span>-1.0 (Strong Negative)</span>
                  <span>0 (No Relation)</span>
                  <span>+1.0 (Strong Positive)</span>
                </div>
                <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-foreground z-10" />
                  
                  {/* The bar */}
                  <motion.div 
                    initial={{ width: 0, x: "50%" }}
                    animate={{ 
                      width: `${Math.abs(pearson) * 50}%`,
                      x: pearson >= 0 ? "50%" : `calc(50% - ${Math.abs(pearson) * 50}%)`,
                      backgroundColor: pearson >= 0 ? "hsl(142 71% 45%)" : "hsl(38 92% 50%)" 
                    }}
                    transition={{ duration: 1.5, type: "spring" }}
                    className="absolute top-0 bottom-0 origin-left"
                  />
                </div>
                <div className="text-center text-2xl font-mono mt-4">
                  r = {pearson.toFixed(3)}
                </div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <CheckpointQuiz 
                actNumber={3}
                question="A Pearson correlation (r) of -0.9 means:"
                options={[
                  { id: "A", text: "There is almost no relationship." },
                  { id: "B", text: "As the feature goes up, the target strongly goes down." },
                  { id: "C", text: "As the feature goes up, the target strongly goes up." },
                  { id: "D", text: "The model is 90% accurate." }
                ]}
                correctOptionId="B"
                nextRoute="/act/4"
              />
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <DoubtSystem 
        actNumber={3}
        screenTitle="Reading Clues"
        currentConcept="Exploratory Data Analysis & Correlation"
        explanations={{
          simple: "Before we do heavy math, we just look at the pictures. Does it look like a line? If not, a line won't help us.",
          story: "A doctor doesn't prescribe medicine without looking at the patient. Looking at the shape and correlation is our physical exam of the data.",
          math: "Correlation (r) normalizes covariance by the standard deviations, giving us a dimensionless scale from -1 to 1 to measure linear dependence."
        }}
        soWhat="If your data is shaped like a circle (correlation near 0), linear regression is useless. You must check this first."
      />
    </div>
  );
}
