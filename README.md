# Gerador de Overlay Lives

Ferramenta pra criar overlays em HTML (com o Claude) e publicá-los numa URL pública,
prontos pra usar como **Browser Source** no OBS da nuvem (IRLToolkit, controlado via neko).

A ideia: você sobe o HTML por uma interface → ele vai pro **GitHub Pages** → você cola a URL no OBS.

```
Claude gera o HTML  →  você sobe na interface  →  GitHub Pages publica  →  cola a URL no Browser Source do OBS
```

---

## Estrutura

```
.
├── overlays/                 ← os overlays publicados (o GitHub Pages serve daqui)
│   └── exemplo.html          ← overlay de exemplo (moldura + AO VIVO + lower-third)
├── uploader/                 ← a interface de upload (app local)
│   ├── server.js
│   ├── public/index.html
│   └── package.json
├── iniciar-uploader.command  ← dois cliques pra abrir a interface (macOS)
└── README.md
```

---

## Configuração inicial (só uma vez)

> Precisa do **Node.js** instalado (https://nodejs.org — versão LTS).

### 1. Crie o repositório no GitHub e ative o Pages

O jeito mais simples (sem terminal) é com o **GitHub Desktop**:

1. Instale o [GitHub Desktop](https://desktop.github.com) e faça login.
2. `File → Add Local Repository` → escolha esta pasta → `create a repository` → **Publish repository** (pode deixar privado? **Não** — o GitHub Pages grátis precisa de repositório **público**).
3. No site do GitHub, vá em **Settings → Pages** do repositório.
4. Em **Build and deployment → Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** → **Save**.

Pronto: seus overlays ficarão em
`https://SEU-USUARIO.github.io/NOME-DO-REPO/overlays/nome-do-overlay.html`

> Alternativa por terminal (se preferir): `git init && git add . && git commit -m "inicio"`,
> crie o repo no GitHub, `git remote add origin <url>` e `git push -u origin main`.
> Depois ative o Pages como no passo 3–4.

### 2. Abra a interface

Dê **dois cliques em `iniciar-uploader.command`** (na primeira vez ele instala as dependências sozinho).
A interface abre em **http://localhost:3000**.

> Se o macOS bloquear o `.command`: clique com o botão direito → **Abrir** → **Abrir**.

---

## Uso no dia a dia

1. Gere o HTML do overlay com o Claude (fundo **transparente**, tamanho da sua live, ex: 1920×1080).
2. Na interface, **arraste o arquivo** (ou cole o código), dê um nome e clique em **Publicar overlay**.
3. A interface te dá a **URL pública**. Clique em **Copiar URL**.
4. No OBS da nuvem (neko): aperte `Ctrl+Alt+Shift` pra abrir o painel de colar, cole a URL,
   aperte `Ctrl+Alt+Shift` de novo, e cole num **Browser Source**.
5. Atualizou o overlay? No OBS, botão direito no source → **Refresh cache of current page**.

> A URL do GitHub pode levar **~1 minuto** pra atualizar depois de publicar.
> Pra conferir na hora, use o botão **Prévia** (abre direto do seu PC).

---

## Dicas pra fazer overlays que funcionam no OBS

- **Fundo transparente:** `html, body { background: transparent; }` — sem isso, fica um retângulo sólido tapando a câmera.
- **Tamanho fixo:** desenhe no tamanho da live (ex: 1920×1080) e use posições absolutas.
- **Animações:** CSS (`@keyframes`) funciona perfeitamente. Veja `overlays/exemplo.html`.
- **Sem dados ao vivo:** estes overlays são estáticos/animados. Pra chat/alertas/contadores ao vivo seria preciso JavaScript + uma fonte de dados (outro projeto).
