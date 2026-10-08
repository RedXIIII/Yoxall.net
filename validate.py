from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json,re
root=Path(__file__).resolve().parent
class HTML(HTMLParser):
 def __init__(self):
  super().__init__();self.links=[];self.ids=[];self.images=[];self.h1=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='a' and 'href' in a:self.links.append(a['href'])
  if tag in ['script','img'] and 'src' in a:self.links.append(a['src'])
  if tag=='link' and 'href' in a:self.links.append(a['href'])
  if tag=='img':self.images.append(a)
pages={}
for file in root.rglob('*.html'):
 if '.git' in file.parts or 'templates' in file.parts:continue
 parsed=HTML();parsed.feed(file.read_text(encoding='utf-8'));pages[file.resolve()]=parsed
fail=[]
for file,html in pages.items():
 if html.h1!=1:fail.append(f'{file.relative_to(root)}: {html.h1} h1s')
 if len(set(html.ids))!=len(html.ids):fail.append(f'{file.relative_to(root)}: duplicate IDs')
 for image in html.images:
  if not image.get('alt'):fail.append(f'{file}: missing alt')
 for href in html.links:
  url=urlparse(href)
  if url.scheme or url.netloc:continue
  target=(root/url.path.lstrip('/') if url.path.startswith('/') else file.parent/url.path).resolve() if url.path else file
  if target.is_dir():target/= 'index.html'
  if not target.is_file():fail.append(f'{file.relative_to(root)} → {href}: missing target')
  elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:fail.append(f'{file.relative_to(root)} → {href}: missing anchor')
print(json.dumps({'pages':len(pages),'errors':fail},indent=2))
raise SystemExit(bool(fail))
