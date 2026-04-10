# HM Motor — Projektspecifika regler

> **Las ../CLAUDE.md forst** — den innehaller alla generella utvecklingsregler.

## ARKITEKTUR

- **GrapesJS v0.21.13** renderar sidan i en **iframe**
- Allt i canvas lever INUTI iframen — JS fran parent kan inte direkt paverka iframe-element utan GrapesJS API eller iframe contentWindow
- Plugins som kraver React (shadcn, Radix, Framer Motion) fungerar INTE — ingen React, inget build-steg
- Plugins som monteras pa DOM (Quill, etc) fungerar INTE cross-iframe
- setCustomRte() far referens till element INUTI iframen
- CSS i `<style>` paverkar parent, INTE canvas-iframe (anvand canvas.styles for iframe-CSS)

## VERKTYG I EDITORN

- GrapesJS inbyggd RTE (fungerar i iframe — enda RTE som gor det)
- Pickr (fargvaljare, parent-side, for Style Manager)
- Cropper.js (bildbeskarning, parent-side, for uploads)
- Asset Manager med GitHub API upload
- CSS sparas i `<style data-gjs-editor>` vid save

## GrapesJS GOTCHAS

- `model.trigger('active')` oppnar RTE och kan overrida panel-switching — kor switchRight() EFTER med delay
- `model.setStyle()` brannar in inline styles — anvand medvetet, inte for "visa computed values"
- `editor.Panels.removePanel()` fungerar inte palitligt — DOM-borttagning ar fallback
- Style Manager visar INTE computed/inherited styles — bara explicit satta. Det ar en GrapesJS-begransning.
- Sector `open: true/false` i config styr vilken sektor som ar oppen fran start

## DEPLOY

- GitHub: https://github.com/Displayteknik/hmmotor (master branch)
- Netlify: `hmmotor-krokom` → https://hmmotor-krokom.netlify.app — AUTO-DEPLOY fran GitHub
- Netlify Identity kraves for /admin/ — kan INTE testas lokalt
- Lokal server: port 3470 via http-server (launch.json)
