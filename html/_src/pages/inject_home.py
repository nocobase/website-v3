# 把 snips/ 里的界面示意填进首页的 <!-- SNIP:名称 --> … <!-- /SNIP:名称 --> 之间（首页不走 wrap.py）。
import os, re
here = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(here, '..', '..', 'homepage.html')
s = open(p, encoding='utf-8').read()
def fill(mo):
    n = mo.group(1)
    return '<!-- SNIP:%s -->%s<!-- /SNIP:%s -->' % (n, open(os.path.join(here, 'snips', n + '.html'), encoding='utf-8').read(), n)
s, k = re.subn(r'<!-- SNIP:(\w+) -->.*?<!-- /SNIP:\1 -->', fill, s, flags=re.S)
open(p, 'w', encoding='utf-8').write(s)
print('filled', k)
