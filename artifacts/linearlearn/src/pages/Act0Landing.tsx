import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Act0Landing() {
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    // Deterministic points so every learner sees the same pattern.
    const newPoints = Array.from({ length: 12 }).map((_, i) => {
      const x = 8 + i * 7.2;
      const noise = [6, -3, 5, -4, 2, -5, 7, -2, 3, -4, 6, -1][i];
      const y = 15 + i * 5.3 + noise;
      return { x, y };
    });
    setPoints(newPoints);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Cinematic animated background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 flex flex-col items-center">
        
        {/* Scatter Plot Animation */}
        <div className="w-full max-w-lg aspect-[4/3] relative mb-12">
          {/* Axis */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 h-px bg-border origin-left"
          />
          <motion.div 
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute bottom-0 left-0 top-0 w-px bg-border origin-bottom"
          />

          {/* Points */}
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 + i * 0.1, type: "spring" }}
              className="absolute w-3 h-3 bg-primary rounded-full -ml-1.5 -mb-1.5"
              style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
            />
          ))}

          {/* Regression Line */}
          <motion.svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="0"
              y1="100"
              x2="100"
              y2="10"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: 2, delay: 2.5, ease: "easeInOut" }}
            />
          </motion.svg>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
            This is Linear Regression.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            In 20 minutes you'll understand exactly how it works. No jargon. Just intuition.
          </p>
          <Link href="/act/1">
            <Button size="lg" className="h-12 px-8 text-lg font-medium" data-testid="btn-begin">
              Begin the Journey
            </Button>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
