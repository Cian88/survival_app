#!/bin/sh
# Lance l'application en local sur http://localhost:8765 (nécessite Python 3).
cd "$(dirname "$0")"
echo "Survonomy : ouvrez http://localhost:8765 dans votre navigateur (Ctrl+C pour arrêter)."
python3 -m http.server 8765 --bind 127.0.0.1
