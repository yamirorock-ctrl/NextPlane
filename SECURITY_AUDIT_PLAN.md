# Plan de Seguridad y Auditoría - Next Plane/Estudio Viral 🛡️

## 1. Auditoría de Secretos y API Keys 🔑

- [ ] **Almacenamiento Local (Electron):** Verificar si `localStorage` es suficiente o si debemos migrar a `keytar` o `electron-store` con encriptación para guardar tokens sensibles (Meta, TikTok, Gemini).
- [ ] **Variables de Entorno (.env):** Confirmar que no haya secretos "quemados" en el código fuente (hardcoded).
- [ ] **Repositorio (Git):** Revisar que el `.gitignore` esté bloqueando correctamente archivos `.env` y carpetas de configuración sensible.

## 2. Protección de Base de Datos (Supabase) 🗄️

- [ ] **Row Level Security (RLS):** Auditar las tablas `products`, `posts`, `users` para asegurar que solo el dueño de la cuenta pueda leer/escribir.
- [ ] **Anon Key vs Service Role:** Confirmar que el frontend (React) solo usa la `ANON_KEY` y no tiene privilegios excesivos.

## 3. Seguridad en la Aplicación (Electron) 💻

- [ ] **Content Security Policy (CSP):** Implementar cabeceras CSP para prevenir inyección de scripts (XSS), especialmente al cargar contenido externo (imágenes de la web, iframes).
- [ ] **Context Isolation:** Verificar que `contextIsolation: true` esté activado en la ventana principal de Electron para evitar que scripts web accedan al sistema operativo.

## 4. Gestión de Errores y Fugas de Información 🚫

- [ ] **Logs de Producción:** Asegurar que los `console.log` con datos sensibles (tokens, respuestas completas de API) se limpien en la versión de producción.
- [ ] **Manejo de Errores UI:** Que los errores mostrados al usuario (como las pantallas rojas de hoy) no revelen rutas de archivos o detalles internos del servidor.

## 5. Prevención de Abuso (Rate Limiting) 🚦

- [ ] **Límites de API:** Si usamos Edge Functions, añadir límites para evitar consumo excesivo de la cuota de Gemini/OpenAI por errores de bucle infinito.

---

_Fecha de Creación: 20 de Febrero de 2026_
_Estado: Pendiente para próxima sesión_
