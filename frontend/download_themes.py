import urllib.request
import json
import os

url = "https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/themes/_list.json"
output_file = "/home/Aditansh/PROJECTS/Velocitype/frontend/src/lib/themes.json"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        
    formatted_themes = []
    for theme in data:
        formatted_themes.append({
            "name": theme.get("name"),
            "bgColor": theme.get("bgColor"),
            "mainColor": theme.get("mainColor"),
            "subColor": theme.get("subColor"),
            "textColor": theme.get("textColor"),
            "errorColor": theme.get("errorColor")
        })
        
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(formatted_themes, f, indent=2)
    print(f"Successfully saved {len(formatted_themes)} themes to {output_file}")
except Exception as e:
    print(f"Error fetching or parsing themes: {e}")
