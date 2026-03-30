#!/bin/bash
# Marie's House — full redeploy script
cd ~/maries-house

echo "Pulling latest files from GitHub..."
curl -s https://raw.githubusercontent.com/btctc/maries-house-okc/main/api/chat.js -o api/chat.js
curl -s https://raw.githubusercontent.com/btctc/maries-house-okc/main/api/contact.js -o api/contact.js
curl -s https://raw.githubusercontent.com/btctc/maries-house-okc/main/app.js -o app.js
echo "API and JS files ready"

echo "Applying image + background fixes to index.html..."
python3 << 'PYEOF'
with open('index.html','r') as f: h = f.read()

# Hero background -> building from logo
h = h.replace("url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=75')", "url('/building_hero.jpg')")
h = h.replace('background-position: center; opacity: .16;', 'background-position: center top; opacity: .42;')

# Senior Black women images
swaps = [
    ('photo-1573496359142-b8d87734a5a2','photo-1602657336575-dea4e08b7e3f'),
    ('photo-1531123897727-8f129e1688ce','photo-1733353246419-f99c9cc5ea76'),
    ('photo-1583795128727-6ec3642408f8','photo-1630726410985-4a9af1f2fe14'),
    ('photo-1559839734-2b71ea197ec2','photo-1668701065787-65d2f8bf5d16'),
    ('photo-1571019613454-1cb2f99b2d8b','photo-1681843807927-6e207f66ea65'),
    ('photo-1569913486515-b74bf3ffb9a2','photo-1681843807927-6e207f66ea65'),
    ('photo-1607746882042-944635dfe10e','photo-1637045199718-0bf58aef4af4'),
]
for old,new in swaps: h = h.replace(old,new)

# Strip broken inline script, use external app.js
cut = h.rfind('<script')
h = h[:cut].rstrip() + '\n<script src="/app.js"></script>\n</body>\n</html>\n'
with open('index.html','w') as f: f.write(h)
print('index.html ready:', len(h), 'bytes')
PYEOF

echo "Deploying to Vercel..."
vercel --prod
echo "Done!"
