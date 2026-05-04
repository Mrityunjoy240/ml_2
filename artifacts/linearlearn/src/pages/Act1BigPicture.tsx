import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/context/AppState";
import { DoubtSystem } from "@/components/DoubtSystem";
import { CheckpointQuiz } from "@/components/CheckpointQuiz";
import { housePriceDataset } from "@/lib/dataset";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from "recharts";

export default function Act1BigPicture() {
  const { userGuess, setUserGuess } = useAppState();
  const [guess, setGuess] = useState<number>(300000);
  const [hasGuessed, setHasGuessed] = useState(false);

  const initialPoints = housePriceDataset.slice(0, 5);
  const targetSqft = 1850;

  const handleGuessSubmit = () => {
    setUserGuess(guess);
    setHasGuessed(true);
  };

  const chartData = initialPoints.map(p => ({ x: p.sqft, y: p.price }));

  return (
    <div className="flex flex-col gap-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-4xl font-serif font-medium text-primary">The Big Picture</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Look at these 5 houses. Generally, as they get bigger, they cost more. 
          Your brain already knows how to find this pattern.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="h-[400px] bg-card border border-border rounded-xl p-4 shadow-xl"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="x" type="number" name="Square Feet" domain={[1000, 3000]} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <YAxis dataKey="y" type="number" name="Price ($)" domain={[150000, 500000]} tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
              <Scatter name="Houses" data={chartData} fill="hsl(var(--primary))" />
              {hasGuessed && (
                <ReferenceDot x={targetSqft} y={guess} r={6} fill="hsl(var(--accent))" stroke="none" />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border">
            <h3 className="text-2xl font-medium">Make a Guess</h3>
            <p className="text-muted-foreground">
              A 6th house comes on the market. It is exactly <strong>1,850 sq ft</strong>.
              Based on the pattern you see, what do you think it's worth?
            </p>

            <div className="pt-8 pb-4">
              <Slider 
                value={[guess]} 
                onValueChange={(vals) => setGuess(vals[0])}
                min={150000} 
                max={500000} 
                step={5000}
                disabled={hasGuessed}
                className="mb-6"
                data-testid="slider-guess"
              />
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-xl">$</span>
                <Input 
                  type="number" 
                  value={guess} 
                  onChange={(e) => setGuess(Number(e.target.value))}
                  disabled={hasGuessed}
                  className="text-2xl font-mono h-14"
                  data-testid="input-guess"
                />
              </div>
            </div>

            {!hasGuessed ? (
              <Button size="lg" className="w-full h-14 text-lg" onClick={handleGuessSubmit} data-testid="btn-submit-guess">
                Lock in Guess
              </Button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-accent-foreground"
              >
                <p className="font-medium text-lg">Your guess: ${guess.toLocaleString()}</p>
                <p className="text-sm opacity-80 mt-1">We'll come back to this number at the end.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full border-accent/30 hover:bg-accent/10" 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                >
                  See the Quiz Below
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {hasGuessed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CheckpointQuiz 
            actNumber={1}
            question="Linear regression finds the _____ that best fits your data."
            options={[
              { id: "A", text: "curve" },
              { id: "B", text: "line" },
              { id: "C", text: "cluster" },
              { id: "D", text: "point" }
            ]}
            correctOptionId="B"
            nextRoute="/act/2"
          />
        </motion.div>
      )}

      <DoubtSystem 
        actNumber={1}
        screenTitle="Big Picture"
        currentConcept="Intuitive Pattern Matching"
        explanations={{
          simple: "You're just looking at dots and drawing an imaginary line in your head. Regression is just a mathematical way to draw that exact same line.",
          story: "Imagine you're an appraiser walking into a new house. You immediately compare it to similar houses you've seen recently. That's all the computer is doing.",
          math: "y = mx + b. But right now, your brain is calculating 'm' and 'b' without you even knowing it based on visual distances."
        }}
        soWhat="Before we throw math at the problem, you need to realize that linear regression is just formalizing human intuition. It's not magic, it's just finding the trend."
      />
    </div>
  );
}
