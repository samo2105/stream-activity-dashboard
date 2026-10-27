# ⚡ StreamPulse - Panel de Actividad de Stream Multiplataforma

[![Deploy to GitHub Pages](https://github.com/samo2105/stream-activity-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/samo2105/stream-activity-dashboard/actions/workflows/deploy.yml)

**StreamPulse** es un dashboard web personalizable y ligero diseñado para streamers y creadores de contenido. Permite monitorear en tiempo real y en una sola pantalla los eventos, alertas, donaciones y chats de múltiples plataformas simultáneamente (**Twitch, Kick, YouTube Live, Streamlabs, StreamElements, BotRix, TikTok** y fuentes web de OBS).

Desplegable de forma gratuita en **GitHub Pages**.

---

## 🚀 Demo en Vivo en GitHub Pages
Accede directamente a la aplicación alojada:
👉 **[https://samo2105.github.io/stream-activity-dashboard/](https://samo2105.github.io/stream-activity-dashboard/)**

---

## ✨ Características Principales

- 🔄 **Incrustación Directa de Eventos (iFrames):** Añade fuentes web de listas de eventos (Streamlabs Event List, StreamElements Activity Feed, BotRix) y popouts de chat nativos.
- 📐 **Diseño Modular y Responsivo:** Cambia entre 1, 2, 3 o 4 columnas, o expande tarjetas a ancho doble (2x) con un solo clic.
- 📺 **Modo Pantalla Completa & Recarga Rápida:** Maximiza cualquier tarjeta para concentrarte en un chat o evento crítico y recarga fuentes desincronizadas con un botón.
- 🔒 **100% Privado y Seguro (LocalStorage):** Tus URLs y tokens de eventos se guardan exclusivamente en el almacenamiento local de tu navegador. **Nunca se envían a GitHub ni a servidores externos**.
- 💾 **Copia de Seguridad JSON:** Exporta o importa tu configuración con un clic para mover tu panel entre PCs o respaldar tus enlaces.
- ⚡ **Plantillas Rápidas:** Preconfiguraciones en un clic para *Dual Stream (Twitch + Kick)*, *Tri-Stream (Twitch + Kick + YouTube)* y *Centro de Alertas*.

---

## 🛠️ Cómo Obtener las URLs de Widgets de Eventos

| Plataforma | Tipo de Fuente | Dónde obtener la URL |
| :--- | :--- | :--- |
| **Streamlabs** | Lista de Eventos / Alertas | Ve a **Streamlabs Dashboard** -> **Widgets** -> **Event List** (o Alert Box) -> Copia la **URL de la fuente de navegador (Browser Source)**. |
| **StreamElements** | Activity Feed / Alertas | Ve a **StreamElements** -> **Streaming Tools** -> **Overlays** -> Abre el menú de 3 puntos -> Copia la **URL del Overlay**. |
| **BotRix** | Alertas y Eventos (Kick/YT/Twitch) | Ve a tu panel de **BotRix** -> **Widgets** -> Selecciona el widget deseado -> Copia el enlace de fuente de OBS. |
| **Twitch** | Chat Popout Oficial | Usa el generador integrado ingresando tu usuario, o usa `https://www.twitch.tv/popout/<canal>/chat?darkpopout`. |
| **Kick** | Chat Popout Oficial | Usa el generador integrado ingresando tu usuario, o usa `https://kick.com/popout/<canal>/chat`. |
| **YouTube** | Live Chat | Usa el generador integrado pegando el ID del stream en vivo de YouTube. |
| **OBS / Custom** | Cualquier Webview | Cualquier URL HTTPS compatible como metas de subs, contador de bits o relojes. |

---

## 💻 Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone git@github.com:samo2105/stream-activity-dashboard.git
cd stream-activity-dashboard

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 📦 Despliegue Automático en GitHub Pages

El repositorio cuenta con una GitHub Action en `.github/workflows/deploy.yml` que:
1. Se activa automáticamente con cada `push` a la rama `main`.
2. Compila el proyecto con Vite y TypeScript.
3. Despliega la carpeta `dist/` directamente en **GitHub Pages**.

### Para activar GitHub Pages en el repositorio:
1. Ve a **Settings** -> **Pages** en el repositorio.
2. En **Build and deployment** -> **Source**, selecciona **GitHub Actions**.

---

## 📄 Licencia
Distribuido bajo la Licencia MIT.
