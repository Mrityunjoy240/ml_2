import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { ArrowRight, Trophy } from "lucide-react";

export default function Act6Prediction() {
  const { dataset, targetColumn, featureColumns, model, userGuess, addGlossaryTerm } = useAppState();
  const [inputValue, setInputValue] = useState<number>(1850); // The sqft from Act 1
  const [hasPredicted, setHasPredicted] = useState(false);

  const feature = featureColumns[0] || "sqft";
  const target = targetColumn || "price";

  // Let's find an actual value from dataset close to the input, or just pick one
  // For emotional reveal, assume we held back a house of roughly this size
  const actualHouse = dataset.find(d => Math.abs(Number(d[feature]) - 1850) < 100) || { [feature]: 1850, [target]: 320000 };
  const actualPrice = Number(actualHouse[target]);
  
  const predictedPrice = model.b0 + model.b1 * inputValue;

  const guessDiff = Math.abs((userGuess || 0) - actualPrice);
  const modelDiff = Math.abs(predictedPrice - actualPrice);
  const modelWon = modelDiff < guessDiff;

  const handlePredict = () => {
    setHasPredicted(true);
  };

  return (
    <div className="flex flex-col gap-12 pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">Prediction</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          The moment of truth. Let's use your trained model to predict the price of that 1,850 sq ft house from Act 1.
        </p>
      </motion.div>

      <div className="bg-card border border-border p-8 rounded-xl shadow-lg">
        <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
                <h3 className="text-2xl font-medium mb-2">Enter {feature}</h3>
                <div className="flex items-center gap-4">
                    <Input 
                        type="number" 
                        value={inputValue} 
                        onChange={e => setInputValue(Number(e.target.value))} 
                        disabled={hasPredicted}
                        className="h-14 text-2xl font-mono"
                    />
                    <span className="text-muted-foreground font-medium">sq ft</span>
                </div>
                <Button size="lg" className="w-full" onClick={handlePredict} disabled={hasPredicted}>
                    Run Prediction
                </Button>
            </div>

            <div className="bg-muted/20 p-6 rounded-lg border border-border font-mono space-y-4 relative">
                <div className="text-sm text-muted-foreground mb-4">Calculation:</div>
                <div className="flex justify-between items-center text-lg">
                    <span>Intercept (b₀):</span>
                    <span>{model.b0.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                    <span>Slope (b₁) × {inputValue}:</span>
                    <span>{(model.b1 * inputValue).toFixed(2)}</span>
                </div>
                <div className="w-full h-px bg-border my-2" />
                <div className="flex justify-between items-center text-2xl font-bold text-primary">
                    <span>Prediction:</span>
                    <span>{hasPredicted ? `$${predictedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}` : "—"}</span>
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

                  <div className="grid md:grid-cols-3 gap-6 text-center">
                      <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          transition={{ delay: 1.5 }}
                          className={`p-6 rounded-xl border ${!modelWon ? 'bg-accent/10 border-accent/30' : 'bg-card border-border'}`}
                      >
                          <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Your Guess</div>
                          <div className={`text-3xl font-mono ${!modelWon ? 'text-accent font-bold' : ''}`}>
                              ${(userGuess || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground mt-4">
                              Off by: ${(guessDiff).toLocaleString()}
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
                          className={`p-6 rounded-xl border ${modelWon ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}
                      >
                          <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Model Prediction</div>
                          <div className={`text-3xl font-mono ${modelWon ? 'text-primary font-bold' : ''}`}>
                              ${predictedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </div>
                          <div className="text-sm text-muted-foreground mt-4">
                              Off by: ${(modelDiff).toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </div>
                      </motion.div>
                  </div>

                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 5 }}
                      className="flex justify-center"
                  >
                      <div className="flex items-center gap-3 bg-muted/50 border border-border px-6 py-4 rounded-full text-lg">
                          <Trophy className={`w-6 h-6 ${modelWon ? 'text-primary' : 'text-accent'}`} />
                          <span>{modelWon ? "The Math wins this round." : "Human intuition wins! Sometimes a straight line isn't enough."}</span>
                      </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }}>
                      <CheckpointQuiz 
                          actNumber={6}
                          question="In the equation y = b₀ + b₁x, what does 'x' represent during prediction?"
                          options={[
                              { id: "A", text: "The actual price of the house" },
                              { id: "B", text: "The error margin" },
                              { id: "C", text: "The new feature value we are evaluating (e.g., 1850 sqft)" },
                              { id: "D", text: "The slope of the line" }
                          ]}
                          correctOptionId="C"
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
          simple: "We plug our new number into the formula we built, and see what pops out.",
          story: "The detective has learned that every muddy footprint means the suspect weighs 10 more pounds. They find a footprint. They calculate the weight.",
          math: "We are evaluating our hypothesis function h_θ(x) at a specific new value of x."
        }}
        soWhat="A model is useless if it only knows about the past. Prediction is the entire reason we build models: to guess the future with math instead of gut feelings."
      />
    </div>
  );
}
