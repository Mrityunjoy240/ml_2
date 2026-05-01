import { useState, useRef, useEffect } from "react";
import { useAppState } from "@/context/AppState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DoubtSystemProps {
  actNumber: number;
  screenTitle: string;
  currentConcept: string;
  explanations: {
    simple: string;
    story: string;
    math: string;
  };
  soWhat: string;
}

export function DoubtSystem({
  actNumber,
  screenTitle,
  currentConcept,
  explanations,
  soWhat,
}: DoubtSystemProps) {
  const [soWhatOpen, setSoWhatOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 border-t border-border bg-sidebar/95 backdrop-blur-md z-40 p-4">
      <div className="max-w-4xl mx-auto flex flex-wrap gap-4 items-center justify-between">

        {/* Say it differently */}
        <div className="flex-1 min-w-[260px]">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2" data-testid="btn-doubt-say-differently">
                <MessageCircle className="w-4 h-4" />
                Say it differently
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Different Perspectives: {currentConcept}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="simple" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="simple" data-testid="tab-simple">Simple</TabsTrigger>
                  <TabsTrigger value="story" data-testid="tab-story">Story</TabsTrigger>
                  <TabsTrigger value="math" data-testid="tab-math">Math</TabsTrigger>
                </TabsList>
                <TabsContent value="simple" className="p-4 bg-muted/30 rounded-md mt-4 leading-relaxed text-sm">
                  {explanations.simple}
                </TabsContent>
                <TabsContent value="story" className="p-4 bg-muted/30 rounded-md mt-4 leading-relaxed text-sm">
                  {explanations.story}
                </TabsContent>
                <TabsContent value="math" className="p-4 bg-muted/30 rounded-md mt-4 leading-relaxed text-sm font-mono">
                  {explanations.math}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* So What? */}
        <div className="flex-1 min-w-[200px] relative">
          <Collapsible open={soWhatOpen} onOpenChange={setSoWhatOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="secondary" className="w-full justify-between" data-testid="btn-doubt-so-what">
                So what?
                {soWhatOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="absolute bottom-full left-0 w-full mb-2 p-4 bg-card border border-border rounded-lg shadow-xl text-sm text-card-foreground">
                {soWhat}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Ask AI */}
        <div className="flex-none">
          <Dialog open={chatOpen} onOpenChange={setChatOpen}>
            <DialogTrigger asChild>
              <Button data-testid="btn-doubt-ask">
                Ask AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md h-[600px] flex flex-col">
              <DialogHeader>
                <DialogTitle>Ask about {currentConcept}</DialogTitle>
              </DialogHeader>
              {chatOpen && (
                <AIChat actNumber={actNumber} screenTitle={screenTitle} currentConcept={currentConcept} />
              )}
            </DialogContent>
          </Dialog>
        </div>

      </div>
    </div>
  );
}

function AIChat({ actNumber, screenTitle, currentConcept }: { actNumber: number; screenTitle: string; currentConcept: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `What's confusing about ${currentConcept}? I'll answer in 3 sentences.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { model } = useAppState();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const convRes = await fetch("/api/anthropic/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Act ${actNumber} - ${screenTitle}` }),
      });
      const conversation = await convRes.json() as { id: number };

      const systemPrompt = `You are a patient linear regression tutor helping a beginner understand "${currentConcept}" on the "${screenTitle}" screen. Answer in exactly 3 short sentences. Stay strictly inside the current lesson context: explain the concept, connect it to the student's current screen, and keep the focus on conceptual understanding, not homework completion. If the student's question is outside this lesson, briefly redirect them back to "${currentConcept}" and answer only the closest in-scope part. The student's current model is ${JSON.stringify(model)}.`;

      const res = await fetch(`/api/anthropic/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg.content, systemPrompt }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong." };
                return updated;
              });
              break;
            }
            if (data.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, content: last.content + data.content };
                return updated;
              });
            }
          } catch {
            // incomplete JSON chunk, skip
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 pr-2 mb-4">
        <div className="flex flex-col gap-3 py-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[88%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground self-end rounded-tr-none"
                  : "bg-muted text-foreground self-start rounded-tl-none"
              }`}
            >
              {msg.content || (loading && i === messages.length - 1 ? "..." : "")}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSend} className="flex gap-2 mt-auto pt-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your question..."
          disabled={loading}
          data-testid="input-doubt-chat"
          autoFocus
        />
        <Button type="submit" disabled={loading || !input.trim()} data-testid="btn-doubt-chat-send">
          Send
        </Button>
      </form>
    </div>
  );
}
