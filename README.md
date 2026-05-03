# LinearLearn

LinearLearn is an interactive web-based learning system for Linear Regression aimed at beginners, especially engineering students.

## What it teaches

1. Dataset loading and inspection
2. Preprocessing decisions
3. Exploratory data analysis
4. Simple and multiple linear regression
5. Model training and evaluation
6. Prediction and interpretation
7. Pen-and-paper understanding
8. Beginner mistakes on messy datasets

## Main features

1. CSV upload and dataset preview
2. Preprocessing lab:
   missing value handling, encoding, scaling, feature selection
3. EDA visuals:
   histograms, scatter plots, correlation
4. Math walkthrough:
   line equation, error, normal equation, gradient descent
5. Train/test split and K-fold validation
6. Prediction workflow with explanation
7. Worksheet-based mastery checks
8. Messy Data Lab and Code Mirror
9. Groq-powered in-context lesson tutor

## Local run

```powershell
pnpm install
pnpm run dev
```

## Full stack run

```powershell
pnpm run dev:full
```

## Build

```powershell
pnpm.cmd --filter @workspace/linearlearn build
```

## Environment

See [.env.example](<C:/New folder (2)/Linear-Learn-main/Linear-Learn-main/.env.example>) for expected variables.

## Project structure

1. `artifacts/linearlearn`
   frontend learning experience
2. `artifacts/api-server`
   API routes and tutor backend
3. `lib/*`
   shared workspace libraries
4. `ROADMAP.md`
   next-phase product plan
5. `REPORT.md`
   assignment report draft
