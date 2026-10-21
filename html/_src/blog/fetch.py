import re, json, html, subprocess, sys
slugs = ['2.2.0','awesome-nocobase-community-plugins','polish-volunteer-fire-department-nocobase-case-study','2.2.0-beta','automate-company-background-research-with-workflows-and-ai-employees','build-interactive-operations-dashboard-with-nocobase','astrolab-nocobase','future-of-software-programmers-revenue-doubled','2.1.0','ai-business-analysis-with-nocobase','add-ai-to-existing-enterprise-systems-with-nocobase','build-car-rental-management-system-with-ai-and-nocobase','open-source-ai-agent-platforms-for-business','build-production-ready-ticketing-system-with-ai']
out = {}
def get(url):
    return subprocess.run(['curl', '-sL', '-A', 'Mozilla/5.0', url], capture_output=True, text=True).stdout
def text(s): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s))).strip()
for slug in slugs:
    out[slug] = {}
    for lang in ('en', 'cn'):
        s = get(f'https://www.nocobase.com/{lang}/blog/{slug}')
        d = {}
        d['title'] = text(re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1))
        m = re.search(r'<p class="para-desc[^"]*"[^>]*>(.*?)</p>', s, re.S); d['desc'] = text(m.group(1)) if m else ''
        m = re.search(r'<time datetime="([^"]+)"', s); d['date'] = m.group(1)[:10] if m else ''
        m = re.search(r'<span title="([^"]+)"', s); d['author'] = html.unescape(m.group(1)) if m else ''
        tg = re.search(r'<div class="group tags".*?</ul>', s, re.S)
        d['tags'] = [text(t) for t in re.findall(r'<a[^>]*>(.*?)</a>', tg.group(0), re.S)] if tg else []
        m = re.search(r'<meta property="og:image" content="([^"]+)"', s); d['image'] = m.group(1) if m else ''
        mm = re.search(r'<div[^>]*class="[^"]*markdown-body[^"]*"[^>]*>', s); assert mm, slug; a = mm.end()
        mt = re.compile(r'<div[^>]*class="[^"]*markdown-toc').search(s, a); b = mt.start() if mt else s.find('</main>', a)
        body = s[a:b]
        body = body[:body.rfind('</div>')]
        body = re.sub(r'\s(data-astro-cid-\w+|class|style|id|loading|decoding|width|height)="[^"]*"', '', body)
        body = re.sub(r'\sdata-astro-cid-\w+', '', body)
        d['body'] = body.strip()
        out[slug][lang] = d
        print(slug, lang, d['date'], d['tags'], len(d['body']), file=sys.stderr)
json.dump(out, open('posts.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
