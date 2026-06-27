// Servidor local da interface de upload de overlays.
// O que ele faz:
//   1. Mostra uma interface web (em http://localhost:3000) pra você subir HTML.
//   2. Salva o arquivo na pasta /overlays do repositório.
//   3. Faz commit + push no GitHub automaticamente (o GitHub Pages publica).
//   4. Te devolve a URL pública pronta pra colar no Browser Source do OBS.

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileP = promisify(execFile);

const PORT = process.env.PORT || 3000;

// O repositório é a pasta de cima (a pasta do projeto). Os overlays moram em /overlays.
const REPO_ROOT = path.resolve(__dirname, '..');
const OVERLAYS_DIR = path.join(REPO_ROOT, 'overlays');
fs.mkdirSync(OVERLAYS_DIR, { recursive: true });

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB por arquivo
});

// ---------- utilitários ----------

// Transforma "Minha Câmera AO VIVO!" em "minha-camera-ao-vivo".
function slugify(name) {
  return (name || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira acentos
    .replace(/\.html?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'overlay';
}

function git(args) {
  return execFileP('git', args, { cwd: REPO_ROOT });
}

// Descobre a URL base do GitHub Pages a partir do "origin" do git.
//   git@github.com:user/repo.git           -> https://user.github.io/repo/
//   https://github.com/user/repo.git       -> https://user.github.io/repo/
//   (repo chamado user.github.io)          -> https://user.github.io/
async function getPagesBaseUrl() {
  try {
    const { stdout } = await git(['remote', 'get-url', 'origin']);
    const url = stdout.trim();
    const m = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/i);
    if (!m) return null;
    const owner = m[1];
    const repo = m[2];
    if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
      return `https://${owner}.github.io/`;
    }
    return `https://${owner}.github.io/${repo}/`;
  } catch {
    return null;
  }
}

async function hasGitRepo() {
  try {
    await git(['rev-parse', '--is-inside-work-tree']);
    return true;
  } catch {
    return false;
  }
}

function listOverlayFiles() {
  return fs
    .readdirSync(OVERLAYS_DIR)
    .filter((f) => /\.html?$/i.test(f))
    .sort();
}

// Faz commit + push. Retorna { pushed, message }.
async function commitAndPush(message) {
  try {
    await git(['add', '-A']);
    try {
      await git(['commit', '-m', message]);
    } catch (e) {
      // "nothing to commit" cai aqui — tudo bem, segue pro push.
    }
    await git(['push']);
    return { pushed: true, message: 'Publicado no GitHub.' };
  } catch (e) {
    const detail = (e.stderr || e.stdout || e.message || '').toString().trim();
    return { pushed: false, message: detail || 'Falha ao publicar no GitHub.' };
  }
}

// ---------- API ----------

app.get('/api/config', async (req, res) => {
  const repo = await hasGitRepo();
  const base = repo ? await getPagesBaseUrl() : null;
  res.json({ hasGit: repo, hasRemote: !!base, pagesBaseUrl: base });
});

app.get('/api/overlays', async (req, res) => {
  const base = await getPagesBaseUrl();
  const items = listOverlayFiles().map((file) => ({
    file,
    name: file.replace(/\.html?$/i, ''),
    pagesUrl: base ? base + 'overlays/' + file : null,
    previewUrl: '/preview/' + file,
  }));
  res.json(items);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    let content;
    let baseName = req.body.name;

    if (req.file) {
      content = req.file.buffer.toString('utf8');
      if (!baseName) baseName = req.file.originalname;
    } else if (req.body.htmlContent && req.body.htmlContent.trim()) {
      content = req.body.htmlContent;
    } else {
      return res
        .status(400)
        .json({ error: 'Envie um arquivo .html ou cole o código HTML.' });
    }

    if (!baseName) {
      return res.status(400).json({ error: 'Dê um nome ao overlay.' });
    }

    const fileName = slugify(baseName) + '.html';
    fs.writeFileSync(path.join(OVERLAYS_DIR, fileName), content, 'utf8');

    const push = await commitAndPush('overlay: ' + fileName);
    const base = await getPagesBaseUrl();

    res.json({
      file: fileName,
      name: fileName.replace(/\.html?$/i, ''),
      pagesUrl: base ? base + 'overlays/' + fileName : null,
      previewUrl: '/preview/' + fileName,
      pushed: push.pushed,
      pushMessage: push.message,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/overlays/:file', async (req, res) => {
  const file = path.basename(req.params.file); // evita path traversal
  const full = path.join(OVERLAYS_DIR, file);
  if (!fs.existsSync(full)) {
    return res.status(404).json({ error: 'Overlay não encontrado.' });
  }
  fs.unlinkSync(full);
  const push = await commitAndPush('remove overlay: ' + file);
  res.json({ ok: true, pushed: push.pushed, pushMessage: push.message });
});

// Pré-visualização instantânea (servida direto do disco, sem esperar o GitHub).
app.use('/preview', express.static(OVERLAYS_DIR));
// Interface.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('\n  Interface de overlays rodando em:  http://localhost:' + PORT + '\n');
});
