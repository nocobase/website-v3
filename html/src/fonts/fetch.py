# 把西文字体从 Google Fonts 下载到 assets/fonts/，页面从本地加载，不再请求 fonts.googleapis.com。
# 中日韩文不用网络字体，用系统字体（苹方、微软雅黑、Hiragino 等，见 site.css 和首页的 --f-sans）：中文字体动辄几 MB，系统字体不用下载。
# 在 _src 下运行：python3 fonts/fetch.py ..   已下载的字体文件不会重复下载；改了字体或字重，改 SETS 后重新运行。
# 每组字体生成一个 CSS（assets/fonts/<名称>.css），字体文件按 Google 的路径放在 assets/fonts/<字体>/<版本>/ 下，
# 保留 Google 按 unicode-range 切好的分片（latin、latin-ext、vietnamese 等），浏览器只下载页面用到的那几片。
import sys, os, re, urllib.request
site = sys.argv[1]
out = os.path.join(site, 'assets', 'fonts')
# 所有页面共用 fonts.css；首页切到俄语时再加载 inter.css（Archivo 没有西里尔字母，见 index.html 的 FONTS）。
# Archivo 只要字重轴：页面没用到宽度轴（font-stretch），带上它文件大一倍多
SETS = {
    'fonts': 'family=Archivo:wght@100..900&family=IBM+Plex+Mono:wght@400;500&display=swap',
    'inter': 'family=Inter:wght@400;500;600;700&display=swap',
}
# 用新版 Chrome 的 UA，Google 才返回 woff2 和 unicode-range 分片
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()
def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(data)
families = set()
for name, query in SETS.items():
    src = 'https://fonts.googleapis.com/css2?' + query
    css = get(src).decode('utf-8')
    def local(mo):
        rel = mo.group(1)  # <字体>/<版本>/<文件>.woff2
        families.add(rel.split('/')[0])
        path = os.path.join(out, rel)
        if not os.path.exists(path):
            save(path, get('https://fonts.gstatic.com/s/' + rel))
        return 'url(%s)' % rel
    css = re.sub(r'url\(https://fonts\.gstatic\.com/s/([^)]+)\)', local, css)
    assert 'gstatic' not in css, name
    head = '/* 由 _src/fonts/fetch.py 生成，不要手改。来源：%s\n   许可：SIL Open Font License 1.1，见各字体目录下的 OFL.txt */\n' % src
    save(os.path.join(out, name + '.css'), (head + css).encode('utf-8'))
    print('wrote', name + '.css', css.count('@font-face'), 'faces')
# 字体许可随字体一起分发；Google 的目录名和 google/fonts 仓库 ofl/ 下的目录名一致
for f in sorted(families):
    path = os.path.join(out, f, 'OFL.txt')
    if not os.path.exists(path):
        save(path, get('https://raw.githubusercontent.com/google/fonts/main/ofl/%s/OFL.txt' % f))
print('fonts:', ', '.join(sorted(families)))
