import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAppState } from "@/context/AppState";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, BookOpen, Bot, CheckCircle2, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ACTS = [
  { id: 1, title: "Big Picture" },
  { id: 2, title: "Your Data" },
  { id: 3, title: "Reading Clues" },
  { id: 4, title: "The Math" },
  { id: 5, title: "Training" },
  { id: 6, title: "Prediction" },
  { id: 7, title: "Report Card" },
  { id: 8, title: "Transformation" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { completedActs, glossary } = useAppState();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border/80 bg-sidebar/80 backdrop-blur-xl">
        <div className="p-6">
          <Link href="/" className="text-xl font-semibold text-foreground tracking-tight" data-testid="link-home">
            LinearLearn
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4">
          <nav className="flex flex-col gap-2">
            {ACTS.map((act) => {
              const isActive = location === `/act/${act.id}`;
              const isCompleted = completedActs.has(act.id);
              
              return (
                <Link
                  key={act.id}
                  href={`/act/${act.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? "bg-primary/15 text-foreground font-medium border border-primary/30" : "hover:bg-muted/70 text-muted-foreground"
                  }`}
                  data-testid={`link-act-${act.id}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span>Act {act.id}: {act.title}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <GlossaryPanel />
          <CatchMeUpButton />
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden h-14 border-b border-border/80 flex items-center px-4 justify-between bg-sidebar/85 backdrop-blur-xl">
          <Link href="/" className="text-lg font-semibold text-foreground tracking-tight">
            LinearLearn
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="btn-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 flex flex-col">
              <div className="p-6 border-b border-border">
                <span className="text-xl font-semibold text-foreground tracking-tight">LinearLearn</span>
              </div>
              <ScrollArea className="flex-1 px-4 py-4">
                <nav className="flex flex-col gap-2">
                  {ACTS.map((act) => (
                    <Link
                      key={act.id}
                      href={`/act/${act.id}`}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                        location === `/act/${act.id}` ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {completedActs.has(act.id) ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      Act {act.id}: {act.title}
                    </Link>
                  ))}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative flex flex-col">
          <div className="flex-1 px-4 py-6 md:px-8 md:py-10 xl:px-12 pb-32">
            <div className="mx-auto h-full w-full max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function GlossaryPanel() {
  const { glossary } = useAppState();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2" data-testid="btn-glossary">
          <BookOpen className="w-4 h-4" />
          Glossary ({glossary.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Glossary</h2>
        {glossary.length === 0 ? (
          <p className="text-muted-foreground">Terms will appear here as you discover them.</p>
        ) : (
          <div className="space-y-4">
            {glossary.map((g, i) => (
              <div key={i} className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-bold text-primary mb-1">{g.term}</h4>
                <p className="text-sm text-card-foreground">{g.definition}</p>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CatchMeUpButton() {
  const [location] = useLocation();
  const { completedActs } = useAppState();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const ACT_NAMES: Record<number, string> = {
    1: "Big Picture (pattern intuition)",
    2: "Your Data (CSV upload, feature/target selection)",
    3: "Reading Clues (EDA, correlation)",
    4: "The Math (draggable line, MSE, gradient descent, normal equation)",
    5: "Training (train/test split, model training)",
    6: "Prediction (step-by-step calculation, model vs guess reveal)",
    7: "Report Card (R², K-Fold, predicted vs actual)",
    8: "Transformation (concepts mastered, cheatsheet)",
  };

  const handleOpen = async () => {
    setOpen(true);
    const currentActId = parseInt(location.split("/").pop() || "0");
    const completedIds = Array.from(completedActs);
    
    if (completedIds.length === 0 && (isNaN(currentActId) || currentActId === 0)) {
      setSummary("You haven't started your journey yet! Click 'Begin the Journey' to start learning about Linear Regression.");
      return;
    }

    setSummary("");
    setLoading(true);

    const completedNames = completedIds.sort().map((n) => ACT_NAMES[n]).filter(Boolean);
    const currentActName = ACT_NAMES[currentActId];
    
    const contextStr = completedNames.length > 0 
      ? `The student has completed: ${completedNames.join("; ")}.`
      : "";
    const currentStr = currentActName ? `They are currently learning about: ${currentActName}.` : "";

    try {
      const res = await fetch(`/api/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `${contextStr} ${currentStr} Summarize their journey so far and explain how their current step fits into the big picture of Linear Regression. exactly 60 words. Be encouraging.`
          }],
          systemPrompt: "You are a friendly tutor summarizing a student's learning progress. Keep your response to exactly 60 words. Focus on the narrative of the journey.",
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (data.done) break;
            if (data.error) {
               setSummary(data.error);
               break;
            }
            if (data.content) setSummary((prev) => prev + data.content);
          } catch {
            // skip
          }
        }
      }
    } catch {
      setSummary("You've been working through linear regression concepts. Keep going!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full justify-start gap-2" onClick={handleOpen} data-testid="btn-catch-up">
          <Bot className="w-4 h-4" />
          Catch me up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Story So Far</DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-muted/50 rounded-md min-h-[100px] flex items-center justify-center">
          {loading && !summary ? (
            <span className="text-muted-foreground animate-pulse">Thinking...</span>
          ) : (
            <p className="text-sm leading-relaxed">{summary || "Start completing acts to build your summary!"}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
