import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAppState } from "@/context/AppState";

interface CheckpointQuizProps {
  actNumber: number;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  nextRoute: string;
}

export function CheckpointQuiz({ actNumber, question, options, correctOptionId, nextRoute }: CheckpointQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [, setLocation] = useLocation();
  const { markActComplete } = useAppState();

  const handleSelect = (id: string) => {
    if (status === "correct") return;
    setSelected(id);
    if (id === correctOptionId) {
      setStatus("correct");
      markActComplete(actNumber);
    } else {
      setStatus("incorrect");
    }
  };

  const handleNext = () => {
    setLocation(nextRoute);
  };

  return (
    <div className="mt-16 p-8 border border-border rounded-xl bg-card/50 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-xl font-serif text-primary mb-2">Checkpoint {actNumber}</h3>
        <p className="text-lg text-card-foreground mb-6">{question}</p>
        
        <div className="space-y-3">
          {options.map(opt => {
            const isSelected = selected === opt.id;
            const isCorrectOption = opt.id === correctOptionId;
            
            let buttonClass = "w-full justify-start text-left h-auto py-4 px-6 text-base whitespace-normal";
            let variant: "outline" | "default" | "destructive" = "outline";
            
            if (status !== "idle") {
              if (isCorrectOption) {
                buttonClass += " border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20";
                variant = "outline";
              } else if (isSelected && status === "incorrect") {
                buttonClass += " border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20";
                variant = "outline";
              } else {
                buttonClass += " opacity-50";
              }
            } else if (isSelected) {
              variant = "default";
            }

            return (
              <Button
                key={opt.id}
                variant={variant}
                className={buttonClass}
                onClick={() => handleSelect(opt.id)}
                disabled={status === "correct"}
                data-testid={`quiz-option-${opt.id}`}
              >
                {opt.text}
              </Button>
            );
          })}
        </div>

        <AnimatePresence>
          {status === "correct" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-4"
            >
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-medium text-lg">Correct!</span>
              </div>
              <Button onClick={handleNext} data-testid="btn-quiz-next">
                Advance to Act {actNumber + 1}
              </Button>
            </motion.div>
          )}
          {status === "incorrect" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-3 text-destructive"
            >
              <XCircle className="w-5 h-5" />
              <span>Not quite. Think about what we just covered.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
