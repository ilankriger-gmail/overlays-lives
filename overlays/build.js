#!/usr/bin/env node
/*
  Gera as versoes arquivo-unico dos overlays (overlays/<cena>.html) a partir de
  overlays/<cena>/index.html, embutindo overlay.css, assets/fonts.css e o avatar.
  Sao essas versoes que se arrastam no uploader / publicam como arquivo unico.

  Uso: node overlays/build.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SCENES = ['comecando', 'javolto', 'encerrada', 'conexao-perdida'];

const fontsCss = fs.readFileSync(path.join(ROOT, 'assets', 'fonts.css'), 'utf8');
const overlayCss = fs.readFileSync(path.join(ROOT, 'overlay.css'), 'utf8');
const avatarB64 = fs.readFileSync(path.join(ROOT, 'assets', 'avatar.png')).toString('base64');

for (const scene of SCENES) {
  let html = fs.readFileSync(path.join(ROOT, scene, 'index.html'), 'utf8');

  html = html
    .replace('<link rel="stylesheet" href="../assets/fonts.css">', () => '<style>\n' + fontsCss + '</style>')
    .replace('<link rel="stylesheet" href="../overlay.css">', () => '<style>\n' + overlayCss + '</style>')
    .replace('src="../assets/avatar.png"', () => 'src="data:image/png;base64,' + avatarB64 + '"')
    .replace('  Estilo compartilhado em ../overlay.css; fontes embutidas em ../assets/fonts.css (funciona offline).',
             '  Versao arquivo-unico gerada por build.js — estilos, fontes e avatar ja embutidos (funciona offline).')
    .replace('  Mudou algo? Rode `node overlays/build.js` pra regerar a versao arquivo-unico (../' + scene + '.html).',
             '  NAO edite este arquivo direto: mude overlays/' + scene + '/index.html e rode `node overlays/build.js`.');

  for (const ref of ['href="../', 'src="../']) {
    if (html.includes(ref)) throw new Error(scene + ': sobrou referencia relativa nao embutida (' + ref + '...)');
  }

  fs.writeFileSync(path.join(ROOT, scene + '.html'), html);
  console.log('gerado: overlays/' + scene + '.html (' + Math.round(html.length / 1024) + 'KB)');
}
