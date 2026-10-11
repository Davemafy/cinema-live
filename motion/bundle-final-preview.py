from pathlib import Path
import base64,json
js=next(Path('dist/assets').glob('*.js')).read_text()
assets=[('final-frame-plate.jpg','image/jpeg'),('cinema-original-wordmark.png','image/png'),('opening.wav','audio/wav'),('final-outro.wav','audio/wav'),('fonts/CormorantGaramond-subset.ttf','font/ttf')]
media={n:'data:'+mime+';base64,'+base64.b64encode(Path('public',n).read_bytes()).decode() for n,mime in assets}
html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CINEMA · The Final Frame</title></head><body style="margin:0;background:#050606;color:#efeee8"><div id="root"></div><script>window.__CINEMA_MEDIA='+json.dumps(media)+'</script><script type="module">'+js.replace('</script','<\\/script')+'</script></body></html>'
Path('out/final/cinema-browser-preview.html').write_text(html)
