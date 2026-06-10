import os
import re
import glob

files_to_process = glob.glob("frontend/app/crm/**/*.tsx", recursive=True)

replacements = {
    r'bg-white(?! dark:bg-)': 'bg-white dark:bg-[#1e293b]',
    r'bg-\[\#f8fafc\](?! dark:bg-)': 'bg-[#f8fafc] dark:bg-[#0f172a]',
    r'bg-\[\#f1f5f9\](?! dark:bg-)': 'bg-[#f1f5f9] dark:bg-[#1e293b]',
    
    r'border-\[\#f1f5f9\](?! dark:border-)': 'border-[#f1f5f9] dark:border-[#334155]',
    r'border-\[\#e2e8f0\](?! dark:border-)': 'border-[#e2e8f0] dark:border-[#334155]',
    r'border-\[\#cbd5e1\](?! dark:border-)': 'border-[#cbd5e1] dark:border-[#475569]',
    r'border-\[\#e5e7eb\](?! dark:border-)': 'border-[#e5e7eb] dark:border-[#334155]',
    r'border-\[\#f3f4f6\](?! dark:border-)': 'border-[#f3f4f6] dark:border-[#334155]',
    
    r'text-\[\#0f172a\](?! dark:text-)': 'text-[#0f172a] dark:text-white',
    r'text-\[\#111827\](?! dark:text-)': 'text-[#111827] dark:text-white',
    r'text-\[\#1e293b\](?! dark:text-)': 'text-[#1e293b] dark:text-gray-100',
    r'text-\[\#334155\](?! dark:text-)': 'text-[#334155] dark:text-gray-200',
    r'text-\[\#374151\](?! dark:text-)': 'text-[#374151] dark:text-gray-200',
    r'text-\[\#475569\](?! dark:text-)': 'text-[#475569] dark:text-gray-300',
    r'text-\[\#4b5563\](?! dark:text-)': 'text-[#4b5563] dark:text-gray-300',
    r'text-\[\#64748b\](?! dark:text-)': 'text-[#64748b] dark:text-gray-400',
    r'text-\[\#6b7280\](?! dark:text-)': 'text-[#6b7280] dark:text-gray-400',
    r'text-\[\#94a3b8\](?! dark:text-)': 'text-[#94a3b8] dark:text-gray-500',
    r'text-\[\#9ca3af\](?! dark:text-)': 'text-[#9ca3af] dark:text-gray-500',
    r'text-\[\#059669\](?! dark:text-)': 'text-[#059669] dark:text-[#34d399]',
    
    r'hover:bg-\[\#f8fafc\](?! dark:hover:bg-)': 'hover:bg-[#f8fafc] dark:hover:bg-[#0f172a]',
    r'hover:bg-\[\#f1f5f9\](?! dark:hover:bg-)': 'hover:bg-[#f1f5f9] dark:hover:bg-[#334155]',
    r'hover:bg-\[\#f3f4f6\](?! dark:hover:bg-)': 'hover:bg-[#f3f4f6] dark:hover:bg-[#334155]',
    r'hover:bg-\[\#f9fafb\](?! dark:hover:bg-)': 'hover:bg-[#f9fafb] dark:hover:bg-[#334155]',
    
    r'hover:border-\[\#e2e8f0\](?! dark:hover:border-)': 'hover:border-[#e2e8f0] dark:hover:border-[#475569]',
    
    r'text-muted-foreground(?! dark:text-)': 'text-muted-foreground dark:text-gray-400',
}

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        pass
