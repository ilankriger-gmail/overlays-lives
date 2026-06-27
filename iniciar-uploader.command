#!/bin/bash
# Dê dois cliques neste arquivo pra abrir a interface de overlays.
cd "$(dirname "$0")/uploader" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js não está instalado."
  echo "  Baixe a versão LTS em https://nodejs.org , instale e rode este arquivo de novo."
  echo ""
  read -r -p "  Pressione Enter para fechar..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "  Instalando dependências (só na primeira vez)..."
  npm install || { echo "  Falhou ao instalar."; read -r -p "  Enter para fechar..."; exit 1; }
fi

echo "  Abrindo http://localhost:3000 ..."
( sleep 1.2; open "http://localhost:3000" ) &
node server.js
