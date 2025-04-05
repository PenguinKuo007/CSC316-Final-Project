# CSC316H1 Final Project - Secondhand Insights

## Section 1: Project Overview

This project aims to support organizations in raising awareness about the negative impacts of smoking and its association with lung cancer. Through data analysis and visualizations, we provide clear insights to help organizations effectively advocate against smoking. The following links provide access to the project website and a brief description of the webpage via the video.

### Website and Screencast
- **Project Website:** https://penguinkuo007.github.io/CSC316-Final-Project/
- **Screencast Video:** [Insert URL here]

In the following sections, Section 2 will provide a brief overview of the code structure, Section 3 will list the primary libraries used, Section 4 will include references, and Section 5 will provide the author's information and contact details.

## Section 2: Code Structure

### Section 2.a: HTML

  - `index.html`: A HTML file hosting the story and visualizations.

### Section 2.b: CSS (`css/`)
  - `style.css`: General styles and styles for the visualizations.
  - `grouped-barchart-styles.css`: Styles for the grouped bar chart.
  - `innovative-vis-styles.css`: Styles for the innovative visualization.
  - `SecondHandSmokerVis.css`: Custom style for the Second-Hand smoker visulization (i.e `SecondHandSmokerVis.js`).

### Section 2.c: JavaScript (`js/`)

  - `main.js`: Initialize all the visualizations and load the datasets.
  - `groupedBarChart.js`: Custom implementation of a grouped bar chart.
  
  - `SmokingStatusVis.js`: Custom implementation of a bar chart visualization on smoking status.
  
  - `SurvivalVis.js`: Custom implementation of area chart visualization on survival month.
  - `SurvivalBrushVis.js`: Custom interactive brushing feature for survival month area chart.
  
  - `innovativeVis.js`: Custom implementation of the innovative visualization.

  - `SecondHandSmokerVis.js`: Compares the number of people developing lung cancer between secondhand smokers and non-secondhand smokers, assuming no prior smoking history.
  
  - `helper.js`: Helper functions.


### Section 2.d: Data

- **Datasets** (`data/`)
  
  - `lung_cancer_data.csv`:  A cleaned dataset related to lung cancer and smoking, used by `SmokingStatusVis.js`, `SurvivalVis.js` and `SurvivalBrushVis.js`.
  
  - `lung_cancer_prediction.csv`:  A cleaned dataset related to lung cancer and smoking, used by `groupedBarChart.js`, `innovativeVis.js` and `SecondHandSmokerVis.js`.

### Section 2.e: Other Assets
- Images (`img/`): Background images for each slide.


## Section 3: Libraries  
We utilized the following libraries during this project for visualization and formatting purposes:

- **Bootstrap (v5.2.2)**: For responsive layouts and style.
- **D3.js (v7)**: For creating interactive data visualizations.
- **fullPage.js (v4.0.35)**: Allows smooth, full-page scrolling and navigation.



## Section 4: References

- Ankit. (2025). Lung Cancer Risk & Prediction Dataset [Data set]. Kaggle. https://doi.org/10.34740/KAGGLE/DSV/10723076
- Rashad Mammadov. (2024). Lung Cancer Prediction [Data set]. Kaggle. https://doi.org/10.34740/KAGGLE/DS/5109540
- Slidesgo. (2025). Smoking Addiction Presentation. Slidesgo. https://slidesgo.com/theme/smoking-addiction


## Section 5: Authors
| Name           | Email                          |
|----------------|--------------------------------|
| Jennifer Cao   | jenni.cao@mail.utoronto.ca     |
| Kuan-Lin Kuo   | luke.kuo@mail.utoronto.ca      |
| Chieh-An Chang | chiehan.chang@mail.utoronto.ca |