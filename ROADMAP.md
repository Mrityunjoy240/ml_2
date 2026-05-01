# LinearLearn Roadmap

## Goal

LinearLearn should become a teaching system that helps a beginner:

1. Understand linear regression conceptually.
2. Solve core linear regression math on paper.
3. Clean messy data before modeling.
4. Implement the workflow in code.
5. Debug common beginner mistakes in real situations.

## Current State

The project already includes:

1. Guided learning flow across the linear regression pipeline.
2. Dataset upload and preprocessing controls.
3. Simple and multiple linear regression support.
4. Training, prediction, and evaluation screens.
5. Worksheet-style pen-and-paper practice.
6. Persistent progress and a printable cheatsheet.

## Next Priorities

### 1. Practice + Debug Layer

Students should make mistakes safely here before they make them in class or interviews.

Planned improvements:

1. Messy Data Lab with missing values, categorical columns, noisy fields, and weak feature choices.
2. Beginner mistake prompts such as:
   - wrong target selection
   - irrelevant feature selection
   - skipped preprocessing
   - misreading evaluation metrics
3. Feedback that explains:
   - what went wrong
   - how to detect it
   - how to fix it

### 2. Code Mirror

Every major concept should have a coding reflection.

Planned improvements:

1. Show Python code for:
   - loading CSV
   - inspecting data
   - cleaning missing values
   - encoding categorical fields
   - scaling features
   - splitting train/test
   - training regression
   - evaluating predictions
2. Keep code aligned with the current screen so the student connects concept, math, and implementation.

### 3. Stronger Paper Mastery

The learner should finish ready to solve a problem by hand.

Planned improvements:

1. More than one worked example.
2. Error-specific worksheet feedback.
3. A final exam-style mode with fewer hints.
4. A stronger printable revision sheet with one full solved example.

### 4. Submission Polish

Planned improvements:

1. Cleaner report assets and screenshots.
2. Better naming and provider-neutral AI route naming.
3. More tests around math and state flows.
4. Smaller production bundle where practical.

## Design Principle

This project should not behave like a black box ML demo.

It should teach in four layers:

1. Visual intuition
2. Step-by-step math
3. Code implementation
4. Real-world judgment on messy data

## Short-Term Build Order

1. Add Messy Data Lab
2. Add Code Mirror panel
3. Add mistake-aware feedback
4. Improve final cheatsheet
5. Add tests and submission polish
