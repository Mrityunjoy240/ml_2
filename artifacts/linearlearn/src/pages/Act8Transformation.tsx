import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { housePriceDataset } from "@/lib/dataset";
import { Printer } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Act8Transformation() {
  const { dataset, model, featureColumns, targetColumn, glossary } = useAppState();
  const [showLabels, setShowLabels] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const initialPoints = housePriceDataset.slice(0, 5);
  const chartData = initialPoints.map(p => ({ x: p.sqft, y: p.price }));

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";

  useEffect(() => {
    const timer1 = setTimeout(() => setShowLabels(true), 2000);
    const timer2 = setTimeout(() => setShowChecklist(true), 6000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const checklist = [
    "You understand that models find patterns in data.",
    "You know to split data into features (X) and targets (Y).",
    "You can visualize the shape and trend of data.",
    "You understand what a correlation is.",
    "You know the formula for a line (y = b₀ + b₁x).",
    "You understand how MSE measures mistakes.",
    "You grasp how Gradient Descent finds the best line.",
    "You know how to evaluate a model with R² and MAE."
  ];

  return (
    <div className="flex flex-col gap-12 pb-32">
      <div className="print:hidden space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-serif font-medium text-primary">Transformation</h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Look at the dots again. They aren't just dots anymore.
            </p>
          </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start print:hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="h-[400px] bg-card border border-border rounded-xl p-4 shadow-xl relative"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[1000, 3000]} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <YAxis dataKey="y" type="number" domain={[150000, 500000]} tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <Scatter name="Houses" data={chartData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>

          <AnimatePresence>
            {showLabels && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 pointer-events-none"
              >
                {/* Simulated floating labels mapping concepts to the chart */}
                <div className="absolute top-[20%] right-[30%] bg-background/80 backdrop-blur-sm border border-primary/50 text-primary px-3 py-1 text-xs rounded-full font-mono shadow-lg">
                  Variance
                </div>
                <div className="absolute top-[50%] right-[10%] bg-background/80 backdrop-blur-sm border border-accent/50 text-accent px-3 py-1 text-xs rounded-full font-mono shadow-lg">
                  Correlation = 0.92
                </div>
                <div className="absolute bottom-[30%] left-[20%] bg-background/80 backdrop-blur-sm border border-primary/50 text-primary px-3 py-1 text-xs rounded-full font-mono shadow-lg">
                  Minimize MSE
                </div>
                <div className="absolute top-[10%] left-[40%] bg-background/80 backdrop-blur-sm border border-destructive/50 text-destructive px-3 py-1 text-xs rounded-full font-mono shadow-lg">
                  y = b₀ + b₁x
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-8">
            <AnimatePresence>
                {showChecklist && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card border border-border p-8 rounded-xl shadow-lg"
                    >
                        <h3 className="text-2xl font-serif font-medium mb-6">The 20 Minute Journey</h3>
                        <div className="space-y-4">
                            {checklist.map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex gap-3 items-start"
                                >
                                    <div className="w-5 h-5 mt-0.5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                    <p className="text-muted-foreground">{item}</p>
                                </motion.div>
                            ))}
                        </div>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="mt-8 pt-6 border-t border-border flex justify-center"
                        >
                            <Button size="lg" className="w-full gap-2" onClick={handlePrint}>
                                <Printer className="w-5 h-5" />
                                Download PDF Cheatsheet
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Cheatsheet for Print - Only visible when printing */}
      <div className="hidden print:block space-y-8 p-8 max-w-4xl mx-auto bg-white text-black">
          <div className="text-center border-b pb-6 mb-8">
              <h1 className="text-4xl font-serif font-bold mb-2">Linear Regression Cheatsheet</h1>
              <p className="text-gray-600">Generated by LinearLearn</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                  <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-gray-500">Your Model</h3>
                  <div className="bg-gray-50 p-6 rounded-lg font-mono">
                      <div className="mb-2 text-gray-600">Equation:</div>
                      <div className="text-lg">y = {model.b0.toFixed(2)} + {model.b1.toFixed(4)}x</div>
                      <div className="mt-4 text-sm">
                          <div>Feature (X): {feature}</div>
                          <div>Target (Y): {target}</div>
                      </div>
                  </div>
              </div>
              
              <div>
                  <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-gray-500">Core Formulas</h3>
                  <div className="space-y-4 font-mono text-sm">
                      <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-gray-500 mb-1">Line Equation</div>
                          <div>y = b₀ + b₁x</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-gray-500 mb-1">Mean Squared Error (MSE)</div>
                          <div>MSE = (1/n) * Σ(actual - predicted)²</div>
                      </div>
                  </div>
              </div>
          </div>

          <div>
              <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-gray-500">Glossary</h3>
              <div className="space-y-4">
                  {glossary.map((g, i) => (
                      <div key={i} className="border-b border-gray-100 pb-2">
                          <span className="font-bold mr-2">{g.term}:</span>
                          <span className="text-gray-700">{g.definition}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className="print:hidden">
        <DoubtSystem 
          actNumber={8}
          screenTitle="Transformation"
          currentConcept="The Big Picture Again"
          explanations={{
            simple: "You started by just guessing. Now you know exactly how to make the computer guess for you perfectly.",
            story: "The apprentice has learned the master's rules. What used to be a gut feeling is now a repeatable science.",
            math: "You have traversed the entire pipeline: EDA → Loss Function definition → Optimization (Gradient Descent/Normal Eq) → Evaluation (MSE, R²) → Inference."
          }}
          soWhat="The math isn't just symbols. It's a formalized way of doing exactly what your brain already does automatically. Now you can scale it to millions of data points."
        />
      </div>
    </div>
  );
}
