import os

def find_file(name, path):
    for root, dirs, files in os.walk(path):
        if name in files:
            return os.path.join(root, name)
    return None

start_dir = r'c:\Users\miche\OneDrive\Documents\rccg'
target = "Member List.xlsx"
result = find_file(target, start_dir)
print(f"Found: {result}")
