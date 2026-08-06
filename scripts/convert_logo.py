import os

svg_path = r'c:\devfreeguy\projects\stand-alone\tip\apps\landing\assets\logo.svg'
out_path = r'c:\devfreeguy\projects\stand-alone\tip\apps\landing\components\ui\LogoIcon.tsx'

with open(svg_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fill="#F1ECFE"', 'fill="currentColor"')
content = content.replace('stroke="#F1ECFE"', 'stroke="currentColor"')
content = content.replace('fill-rule', 'fillRule')
content = content.replace('clip-rule', 'clipRule')
content = content.replace('stroke-width', 'strokeWidth')
content = content.replace('stroke-linecap', 'strokeLinecap')
content = content.replace('stroke-linejoin', 'strokeLinejoin')

jsx_content = f"""import React from 'react';

export function LogoIcon({{ className = '' }}: {{ className?: string }}) {{
  return (
    <div className={{className}}>
      {content.replace('<svg ', '<svg width="100%" height="100%" className="w-full h-full" ')}
    </div>
  );
}}
"""

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(jsx_content)

print('Created LogoIcon.tsx')
