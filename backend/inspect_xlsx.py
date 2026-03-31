import pandas as pd
import os

file_path = r'c:\Users\miche\OneDrive\Documents\rccg\backend\church_management\Member List.xlsx'

if os.path.exists(file_path):
    try:
        df = pd.read_excel(file_path)
        print("Columns:")
        print(df.columns.tolist())
        print("\nFirst 5 rows:")
        print(df.head().to_string())
        
        # Cleaned columns (to match backend logic)
        cleaned_cols = [c.lower().replace(' ', '_').strip() for c in df.columns]
        print("\nCleaned Columns:")
        print(cleaned_cols)
    except Exception as e:
        print(f"Error reading file: {e}")
else:
    print(f"File not found: {file_path}")
