export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const xMean = mean(x);
  const yMean = mean(y);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    denomX += xDiff * xDiff;
    denomY += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function normalEquation(X: number[][], y: number[]): number[] {
  // Simple 1D linear regression for now, returning [b0, b1]
  // Assuming X is a 2D array where each row is [1, x_val] or just [x_val]
  // If we assume a single feature:
  if (X.length === 0 || y.length === 0) return [0, 0];
  
  // Flatten X assuming single feature for simple linear regression
  const xVals = X.map(row => row.length > 1 ? row[1] : row[0]);
  
  const xMean = mean(xVals);
  const yMean = mean(y);
  
  let num = 0;
  let den = 0;
  
  for (let i = 0; i < xVals.length; i++) {
    const xDiff = xVals[i] - xMean;
    num += xDiff * (y[i] - yMean);
    den += xDiff * xDiff;
  }
  
  const b1 = den === 0 ? 0 : num / den;
  const b0 = yMean - b1 * xMean;
  
  return [b0, b1];
}

export function gradientDescent(
  X: number[][], 
  y: number[], 
  lr: number, 
  epochs: number
): { coefficients: number[]; lossHistory: number[] } {
  // For 1D: X is array of [x_val]
  const xVals = X.map(row => row.length > 1 ? row[1] : row[0]);
  const n = xVals.length;
  
  let b0 = 0;
  let b1 = 0;
  const lossHistory: number[] = [];
  
  for (let iter = 0; iter < epochs; iter++) {
    let b0_grad = 0;
    let b1_grad = 0;
    let current_loss = 0;
    
    for (let i = 0; i < n; i++) {
      const pred = b0 + b1 * xVals[i];
      const err = pred - y[i];
      
      b0_grad += err;
      b1_grad += err * xVals[i];
      current_loss += err * err;
    }
    
    b0_grad = (2 / n) * b0_grad;
    b1_grad = (2 / n) * b1_grad;
    
    b0 -= lr * b0_grad;
    b1 -= lr * b1_grad;
    
    lossHistory.push(current_loss / n);
  }
  
  return { coefficients: [b0, b1], lossHistory };
}

export function mse(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.pow(actual[i] - predicted[i], 2);
  }
  return sum / actual.length;
}

export function mae(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.abs(actual[i] - predicted[i]);
  }
  return sum / actual.length;
}

export function rSquared(actual: number[], predicted: number[]): number {
  if (actual.length === 0 || actual.length !== predicted.length) return 0;
  const yMean = mean(actual);
  let ssTot = 0;
  let ssRes = 0;
  
  for (let i = 0; i < actual.length; i++) {
    ssTot += Math.pow(actual[i] - yMean, 2);
    ssRes += Math.pow(actual[i] - predicted[i], 2);
  }
  
  if (ssTot === 0) return 1;
  return 1 - (ssRes / ssTot);
}

export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const minVal = min(values);
  const maxVal = max(values);
  if (maxVal === minVal) return values.map(() => 0);
  return values.map(v => (v - minVal) / (maxVal - minVal));
}

export function zScoreStandardize(values: number[]): number[] {
  if (values.length === 0) return [];
  const m = mean(values);
  const s = stdDev(values);
  if (s === 0) return values.map(() => 0);
  return values.map(v => (v - m) / s);
}

export function trainTestSplit<T>(data: T[], ratio: number): { train: T[]; test: T[] } {
  const trainSize = Math.floor(data.length * ratio);
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return {
    train: shuffled.slice(0, trainSize),
    test: shuffled.slice(trainSize)
  };
}

export function kFoldCV(X: number[][], y: number[], k: number): number[] {
  const n = X.length;
  const foldSize = Math.floor(n / k);
  const rSquaredValues: number[] = [];
  
  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < k; i++) {
    const testIndices = indices.slice(i * foldSize, (i === k - 1) ? n : (i + 1) * foldSize);
    const trainIndices = indices.filter(idx => !testIndices.includes(idx));
    
    const XTrain = trainIndices.map(idx => X[idx]);
    const yTrain = trainIndices.map(idx => y[idx]);
    
    const XTest = testIndices.map(idx => X[idx]);
    const yTest = testIndices.map(idx => y[idx]);
    
    const coeffs = normalEquation(XTrain, yTrain);
    
    const predictions = XTest.map(row => coeffs[0] + coeffs[1] * (row.length > 1 ? row[1] : row[0]));
    rSquaredValues.push(rSquared(yTest, predictions));
  }
  
  return rSquaredValues;
}
