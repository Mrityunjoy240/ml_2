import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import type { DataRow } from "@/context/AppState";
import { mean, normalEquation } from "@/lib/math";

interface WorksheetEngineProps {
  dataset: DataRow[];
  feature: string;
  target: string;
  onScore?: (score: number) => void;
}

function isClose(user: number, expected: number, tolerance = 0.02) {
  const abs = Math.abs(user - expected);
  const rel = Math.abs(expected) > 1 ? abs / Math.abs(expected) : abs;
  return rel <= tolerance;
}

export function WorksheetEngine({ dataset, feature, target, onScore }: WorksheetEngineProps) {
  const rows = useMemo(() => (dataset.length ? dataset.slice(0, 3) : [
    { [feature]: 1000, [target]: 210000 },
    { [feature]: 1500, [target]: 275000 },
    { [feature]: 2000, [target]: 340000 },
  ]), [dataset, feature, target]);

  const x = rows.map((r) => Number(r[feature]));
  const y = rows.map((r) => Number(r[target]));
  const xBar = mean(x);
  const yBar = mean(y);
  const [b0, b1] = normalEquation(x.map((v) => [v]), y);
  const xNew = 1850;
  const yPred = b0 + b1 * xNew;

  const [ansXBar, setAnsXBar] = useState("");
  const [ansYBar, setAnsYBar] = useState("");
  const [ansB1, setAnsB1] = useState("");
  const [ansB0, setAnsB0] = useState("");
  const [ansPred, setAnsPred] = useState("");
  const [checked, setChecked] = useState(false);

  const checks = {
    xBar: isClose(Number(ansXBar), xBar),
    yBar: isClose(Number(ansYBar), yBar),
    b1: isClose(Number(ansB1), b1),
    b0: isClose(Number(ansB0), b0),
    pred: isClose(Number(ansPred), yPred),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <h4 className="text-xl font-semibold">Do It Yourself Worksheet</h4>
      <p className="text-sm text-muted-foreground">Compute by hand, then enter your answers.</p>
      <div className="font-mono text-sm">
        {rows.map((r, i) => (
          <div key={i}>Row {i + 1}: x={r[feature]}, y={r[target]}</div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Input placeholder="x_bar" value={ansXBar} onChange={(e) => setAnsXBar(e.target.value)} />
        <Input placeholder="y_bar" value={ansYBar} onChange={(e) => setAnsYBar(e.target.value)} />
        <Input placeholder="b1 (slope)" value={ansB1} onChange={(e) => setAnsB1(e.target.value)} />
        <Input placeholder="b0 (intercept)" value={ansB0} onChange={(e) => setAnsB0(e.target.value)} />
        <Input className="md:col-span-2" placeholder={`Prediction at x=${xNew}`} value={ansPred} onChange={(e) => setAnsPred(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button onClick={() => { setChecked(true); onScore?.(score); }}>Check My Work</Button>
      </div>
      {checked && (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">{checks.xBar ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />} x_bar = {xBar.toFixed(2)}</div>
          <div className="flex items-center gap-2">{checks.yBar ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />} y_bar = {yBar.toFixed(2)}</div>
          <div className="flex items-center gap-2">{checks.b1 ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />} b1 = {b1.toFixed(4)}</div>
          <div className="flex items-center gap-2">{checks.b0 ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />} b0 = {b0.toFixed(2)}</div>
          <div className="flex items-center gap-2">{checks.pred ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-destructive" />} prediction = {yPred.toFixed(2)}</div>
          <div className="pt-2 font-medium">Score: {score}/5</div>
        </div>
      )}
    </div>
  );
}
