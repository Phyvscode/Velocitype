import urllib.request
import re
import json

themes = ["serika_dark", "dracula", "catppuccin", "nord", "vscode", "gruvbox_dark", "rose_pine", "monokai", "solarized_dark"]

results = []

for t in themes:
    url = f"https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/themes/{t}.css"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            css = response.read().decode()
            
        bg = re.search(r'--bg-color:\s*(#.+?);', css)
        main = re.search(r'--main-color:\s*(#.+?);', css)
        caret = re.search(r'--caret-color:\s*(#.+?);', css)
        sub = re.search(r'--sub-color:\s*(#.+?);', css)
        text = re.search(r'--text-color:\s*(#.+?);', css)
        error = re.search(r'--error-color:\s*(#.+?);', css)
        error_extra = re.search(r'--error-extra-color:\s*(#.+?);', css)
        
        results.append({
            "name": t.replace('_', ' ').title(),
            "bgColor": bg.group(1) if bg else "#000000",
            "mainColor": main.group(1) if main else "#ffffff",
            "caretColor": caret.group(1) if caret else (main.group(1) if main else "#ffffff"),
            "subColor": sub.group(1) if sub else "#888888",
            "textColor": text.group(1) if text else "#cccccc",
            "errorColor": error.group(1) if error else "#ff0000",
            "errorExtraColor": error_extra.group(1) if error_extra else "#aa0000"
        })
    except Exception as e:
        pass

with open('frontend/src/lib/themes.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"Downloaded {len(results)} themes.")
