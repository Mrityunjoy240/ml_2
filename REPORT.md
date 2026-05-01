# CIA-1 Report

## Title

Design and Development of an Interactive Web-Based Learning System for Linear Regression

## 1. System Design

LinearLearn is designed as a guided learning pipeline rather than a black-box prediction tool.
The student moves through sequential acts:

1. Visual intuition
2. Dataset understanding
3. Exploratory analysis
4. Mathematical formulation
5. Training
6. Prediction
7. Evaluation
8. Transformation and revision

The frontend is built as a React application with page-wise instructional stages.
The backend supports the AI tutor and streaming responses.

### Architecture

1. `artifacts/linearlearn`
   frontend app
2. `artifacts/api-server`
   API server and tutor routes
3. `lib/math`
   regression math helpers and metrics
4. `lib/preprocessing`
   preprocessing transformations and readiness assessment
5. `context/AppState`
   shared learning state and persistence

## 2. Explanation Strategy

The explanation strategy follows a beginner-first teaching model:

1. Show the idea visually first
2. Explain it in plain English
3. Introduce the math only after intuition forms
4. Let the student interact
5. Let the student make mistakes and learn from consequences

The site also uses:

1. Doubt panels for "simple / story / math" explanations
2. Worksheet checks for pen-and-paper reasoning
3. Code Mirror for Python equivalents
4. Messy Data Lab for real-world preprocessing judgment

## 3. Functional Coverage

### Dataset Input Module

Implemented:

1. CSV upload
2. Sample dataset
3. Messy dataset lab
4. Dataset preview
5. Shape and data type summary

### Preprocessing Interface

Implemented:

1. Missing value handling
2. Encoding choices
3. Feature scaling
4. Feature selection
5. Before vs after comparison
6. What/why explanations
7. Readiness feedback

### EDA

Implemented:

1. Histograms
2. Scatter plots
3. Correlation analysis
4. Feature-target relationship visualization

### Linear Regression Learning Module

Implemented:

1. Hypothesis formulation
2. Cost and error explanation
3. Parameter learning
4. Simple linear regression
5. Multiple linear regression
6. Formula display
7. Intermediate values
8. Step-by-step sample computation

### Training Configuration

Implemented:

1. User-controlled train/test split
2. User-controlled K-fold validation

### Model Training and Visualization

Implemented:

1. Regression line for single feature
2. Learned coefficients and intercept
3. Loss convergence view
4. Multi-feature coefficient display

### Prediction and Inference

Implemented:

1. New sample input
2. Step-by-step prediction terms
3. Final prediction display
4. Actual vs guess vs model comparison

### Evaluation Metrics

Implemented:

1. MSE
2. MAE
3. R2
4. Cross-validation scores
5. Predicted vs actual visualization

### Educational Layer

Implemented:

1. Explanation panels
2. Code Mirror
3. Why-this-step teaching copy
4. Predicted vs actual comparison
5. Pen-and-paper worksheet gating

## 4. Real-World Learning Focus

This system is designed not only to demonstrate linear regression, but to prepare a beginner to:

1. explain the concept clearly
2. solve core parts on paper
3. clean a messy dataset
4. connect the workflow to Python code

## 5. Screenshots

Add screenshots for:

1. Landing and visual intuition
2. Dataset upload / messy data lab
3. Preprocessing before vs after
4. EDA correlation screen
5. Math walkthrough and worksheet
6. Training and coefficient card
7. Prediction comparison
8. Evaluation and K-fold screen
9. Final cheatsheet

## 6. Future Improvements

Planned next steps:

1. Stronger mistake-aware challenge mode
2. More paper-practice examples
3. Guided coding exercises, not just code display
4. More tests and final submission polish
