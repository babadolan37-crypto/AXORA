import os
import re

def get_unused_imports(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Regex to find lucide-react imports
    # Handles: import { A, B, C } from 'lucide-react';
    # Does NOT handle: import * as Lucide from 'lucide-react'; (which is fine, rarely used here)
    import_pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]")
    
    matches = import_pattern.findall(content)
    if not matches:
        return []

    unused = []
    
    # Clean content by removing the import lines to avoid self-matching
    content_no_imports = import_pattern.sub('', content)
    
    for match in matches:
        # Split by comma and clean whitespace
        imports = [i.strip() for i in match.split(',')]
        for imp in imports:
            if not imp: continue
            
            # Handle aliases: "Image as ImageIcon"
            if ' as ' in imp:
                name_to_check = imp.split(' as ')[1].strip()
            else:
                name_to_check = imp.strip()
            
            # Simple check: is the name used in the rest of the file?
            # We look for the name followed by non-word char, or preceded by non-word char
            # This is a heuristic but usually works well for components/icons
            
            # Regex for usage: boundary + name + boundary
            usage_pattern = re.compile(r'\b' + re.escape(name_to_check) + r'\b')
            
            if not usage_pattern.search(content_no_imports):
                unused.append(imp)

    return unused

def scan_directory(directory):
    files_with_issues = {}
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root:
            continue
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                file_path = os.path.join(root, file)
                try:
                    unused = get_unused_imports(file_path)
                    if unused:
                        files_with_issues[file_path] = unused
                except Exception as e:
                    print(f"Error scanning {file_path}: {e}")
    
    return files_with_issues

if __name__ == "__main__":
    base_dir = "/Users/babadolan/Desktop/Spreadsheet Akuntansi PT/src"
    issues = scan_directory(base_dir)
    
    if issues:
        print("Found unused imports in the following files:")
        for file_path, unused in issues.items():
            print(f"{file_path}: {', '.join(unused)}")
    else:
        print("No unused imports found.")
