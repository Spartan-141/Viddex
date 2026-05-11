import re

with open('cuevana_js.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Find strings that look like API paths
routes = re.findall(r"[\"'](/[a-zA-Z0-9/\-_]+)[\"']", js)
routes = list(set([r for r in routes if 'wp' in r or 'api' in r or 'v1' in r]))

print("Routes found:")
for r in sorted(routes):
    print(r)
