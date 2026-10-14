# Vestuario Studio

Sistema de gestión visual de vestuario, alumnas, diseños, eventos y cobranza para el **Estudio de Arte Chantal Aiello**.

Diseñadora: **Silvana Ricutini**

---

## ¿Cómo funciona?

Vestuario Studio tiene **2 modos** de uso:

### Modo local (recomendado)
- Corre 100% en la PC de Silvana.
- Sin internet, sin esperas, sin commits por cambio.
- Los cambios se guardan **al instante** en archivos JSON del disco.
- Cuando quiere respaldar, click en **"Backup a GitHub"**.

### Modo online (opcional)
- Se sirve desde GitHub Pages.
- Útil para consultar desde otro dispositivo.
- Requiere configurar un token de GitHub (ver más abajo).

---

## Requisitos

- **Python 3.8+** (https://www.python.org/downloads/)
- **Git** (https://git-scm.com/)
- Navegador moderno (Chrome, Edge o Firefox)

---

## Setup inicial (una sola vez por PC)

### 1. Instalar Python y Git

```powershell
winget install Python.Python.3.14
winget install --id Git.Git -e