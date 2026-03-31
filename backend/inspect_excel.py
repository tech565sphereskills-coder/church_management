import pandas as pd
import os

file_path = r'c:\Users\miche\OneDrive\Documents\rccg\backend\church_management\Member List.xlsx'
if os.path.exists(file_path):
    df = pd.read_excel(file_path)
    print("Columns:", df.columns.tolist())
    print("First 5 rows:")
    print(df.head())
else:
    print(f"File not found at {file_path}")
