import pandas as pd
import numpy as np

df = pd.read_csv("data/lung_cancer_prediction.csv")

# Generate a random number for each row
df['Rand'] = np.random.rand(len(df))

# Use np.where() to assign "Yes" or "No"
df['Second_Hand_Smoke'] = np.where(df['Rand'] < 0.6, "Yes", "No")

# Drop the helper column
df.drop(columns='Rand', inplace=True)

# Save to Excel (requires openpyxl or xlsxwriter)
df.to_excel("d/your_data_modified.xlsx", index=False)
