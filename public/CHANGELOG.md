# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

## [Unreleased]

### [docs] V0.4.1 — Segunda pasada a los comentarios con la skill humanizer — 2026-10-05

**Motivo:** el usuario instaló la skill (se llama `humanizer`, no `humanize`) y pidió revisar con ella los comentarios ya escritos. Siete correcciones, todas de redacción. No cambió ninguna línea de código.

**Cambios:**

- `styles.css` — eliminadas tres construcciones del tipo "no es X, es Y", que suman énfasis sin agregar información: el comentario de `min-height: 44px`, el de `color-scheme: dark` y el del color de error. Reescrito el aviso de `animation-iteration-count` sin el "es clave".
- `app.js` — quitado el autoelogio "avisamos con palabras normales, sin términos técnicos" del bloque `catch` de `cargarClima()`, reemplazado por lo que hace realmente. Corregida la tilde suelta en "rompería", que rompía la convención sin tildes del resto de los comentarios.
- `index.html` — variada la muletilla "a propósito", que se repetía en cuatro comentarios.

**Verificación:**

- Revisión con grep: sin guiones largos en comentarios (los dos que quedan están dentro de cadenas de código y son el separador visible en la interfaz), sin construcciones "no es X sino Y", y "a propósito" bajó de cuatro apariciones a una por archivo.
- Búsqueda de "Medellín" → 23°C, icono de lluvia, 7 días. Consola sin errores.

### [refactor] V0.4.0 — Iconos de Google, comentarios reescritos y requisitos en el README — 2026-10-05

**Motivo:** usar los iconos existentes de Google en lugar de dibujarlos a mano, dejar los comentarios del código en un lenguaje que entienda alguien que está aprendiendo, y documentar qué hace falta tener instalado para correr el proyecto.

**Cambios:**

- Iconos: se reemplazaron los SVG dibujados en `app.js` por **Material Symbols de Google**, cargados como fuente desde un `<link>` en el `<head>`.
  - `app.js` — se eliminaron `piezaNube()`, `piezaGotas()`, `PIEZA_SOL` y `svgClima()`. Quedó `ICONOS` como un mapa de ocho nombres (`sunny`, `clear_night`, `partly_cloudy_day`, `cloud`, `foggy`, `rainy`, `weather_snowy`, `thunderstorm`) y `crearIcono()`, que devuelve un `<span>` con las clases correspondientes, `aria-hidden` y `translate="no"` para que el traductor del navegador no rompa la ligadura.
  - `index.html` — dos `preconnect` y el `<link>` de la fuente de iconos.
  - `styles.css` — color por tipo de clima, `font-variation-settings` para el relleno y el grosor, y animaciones de sol, lluvia y tormenta sobre el glifo.
  - `font-size: inherit` en `.icono`: la hoja de Google define `font-size: 24px` sobre `.material-symbols-rounded`, que gana sobre el tamaño heredado del contenedor. Sin esa línea todos los iconos se encogen a 24px.
- Comentarios: reescritos los tres archivos (`index.html`, `styles.css`, `app.js`) en un tono de notas de aprendizaje, explicando por qué está cada cosa y no solo qué hace. Se agregaron avisos prácticos ("sin esto no funciona", "cuidado: si borras esto se rompe") y el comando para levantar el servidor dentro de la cabecera de `app.js`. No cambió ninguna línea de lógica.
- `README.md` — nueva sección "Qué necesitas para correrlo" con la tabla de requisitos, los comandos para validar la instalación (`python --version`, `py --version`, `where python`), la alternativa con `npx serve` y qué hacer si el puerto está ocupado. Actualizada la sección de iconos con la tabla de nombres de Material Symbols.

**Verificación:**

- Búsqueda de "Cali" → Santiago de Cali, 26°C, icono de lluvia en la tarjeta actual y en los días; jueves con icono de tormenta.
- Renderizados los ocho iconos en pantalla: los ocho nombres existen en Material Symbols y se ven correctamente.
- `font-size` calculado del icono principal: 96px (antes 24px por la regla de Google).
- Consola del navegador sin errores.

### [feat] V0.3.0 — Iconos SVG del clima en la tarjeta actual y en el pronóstico — 2026-10-05

**Motivo:** mostrar una imagen alusiva al clima junto a los datos. Se verificó la documentación de Open-Meteo: la API **no entrega imágenes, iconos ni animaciones**, únicamente el código WMO `weather_code`. Por eso los dibujos se generan en el propio cliente como SVG en línea, sin archivos, sin CDN y sin librerías de iconos.

**Cambios:**

- `app.js` — nueva sección de iconos:
  - `piezaNube()` y `piezaGotas()` arman las partes reutilizables (nube, gotas de lluvia, copos de nieve); `PIEZA_SOL` dibuja el disco con ocho rayos.
  - `ICONOS` con ocho dibujos: despejado, noche, parcial, nublado, niebla, lluvia, nieve y tormenta.
  - `grupoIcono(codigo, esDia)` mapea el `weather_code` al dibujo correspondiente.
  - `svgClima(codigo, esDia)` devuelve el `<svg>` listo para insertar. El contenido sale solo de constantes locales, nunca de la respuesta de la API.
  - Añadido `is_day` al parámetro `current` del endpoint forecast, para dibujar sol de día y luna de noche en el cielo despejado. El pronóstico diario siempre usa la versión diurna porque el bloque `daily` no incluye `is_day`.
  - `pintarActual()` y `pintarPronostico()` insertan el icono correspondiente.
- `index.html` — `.actual__fila` envuelve el icono y la temperatura; contenedor `#actual-icono` con `aria-hidden` porque la descripción textual de al lado ya transmite la misma información.
- `styles.css` — tamaños de icono (96px en la tarjeta actual, 48px por día) y animaciones con `transform`/`opacity`: sol girando en 24s, gotas cayendo con retardo escalonado, rayo parpadeando. Añadido `animation-iteration-count: 1` al bloque `prefers-reduced-motion`, sin lo cual las animaciones infinitas seguirían repitiéndose a toda velocidad; las gotas se fijan visibles y quietas en ese modo.

**Verificación:**

- Búsqueda de "Cali" → Santiago de Cali, 26°C, "Llovizna ligera" con icono de lluvia; los 7 días muestran su icono, incluido tormenta para el jueves.
- Renderizados los ocho dibujos en pantalla (despejado, noche, parcial, nublado, niebla, lluvia, nieve, tormenta): todos legibles en modo oscuro y en modo claro.
- Consola del navegador sin errores.

### [chore] V0.2.1 — Eliminada la carpeta .claude del proyecto — 2026-10-05

**Motivo:** `.claude/launch.json` era solo configuración de la herramienta usada para levantar el servidor local; no forma parte del producto y no debe aparecer en el repositorio.

**Cambios:**

- Eliminada la carpeta `.claude/` y su único archivo `launch.json`. El proyecto queda con cinco archivos: `index.html`, `styles.css`, `app.js`, `README.md`, `CHANGELOG.md`.

**Verificación:**

- `find .claude` ya no devuelve nada; el listado del directorio solo muestra los cinco archivos del proyecto.
- El servidor local en `http://localhost:8000` sigue respondiendo 200 (la carpeta no afectaba a la app).

### [feat] V0.2.0 — Sección de copyright en el pie — 2026-10-05

**Motivo:** acreditar la autoría de la web en la propia interfaz.

**Cambios:**

- `index.html` — línea de copyright en el `<footer>`: "© {año} Creado por Jeisson Orozco. Todos los derechos reservados.", con el año en un `<span id="anio">` y el valor actual escrito en el HTML como respaldo si el JS no corre.
- `app.js` — referencia `el.anio` y asignación del año desde `new Date().getFullYear()` en el bloque de arranque, para no mantenerlo a mano.
- `styles.css` — `.pie__copyright` con separación superior y opacidad leve; `margin: 0` en los párrafos del pie para que las dos líneas queden juntas.

**Verificación:**

- Recargado en `http://localhost:8000`: el pie muestra "© 2026 Creado por Jeisson Orozco. Todos los derechos reservados." bajo la línea de Open-Meteo.
- Consola del navegador sin errores.

### [feat] V0.1.0 — Web app de clima con Open-Meteo — 2026-10-05

**Motivo:** crear una web app de clima funcional con HTML, CSS y JavaScript vanilla, sin frameworks ni dependencias, que consuma la API pública de Open-Meteo.

**Cambios:**

- `index.html` — estructura semántica: cabecera con toggle de tema, formulario de búsqueda, lista de coincidencias de geocoding, región de estado `aria-live`, tarjeta de clima actual y lista de pronóstico de 7 días. Enlace "Saltar al contenido" como primer elemento enfocable.
- `styles.css` — CSS puro con variables de tema en `:root`, redefinición bajo `:root[data-theme="dark"]` y bloque `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme="light"])` para evitar el parpadeo blanco antes de que corra el JS. Layout con grid/flex, rejillas `auto-fit` para los detalles y los días, único breakpoint en 56rem. Foco visible global, áreas táctiles de 44px, `font-variant-numeric: tabular-nums` en todos los números, bloque `prefers-reduced-motion`.
- `app.js` — lógica completa:
  - Tabla `CODIGOS_WMO` que traduce el `weather_code` de la API a texto en español.
  - `buscarCiudades()` contra `geocoding-api.open-meteo.com/v1/search`.
  - `obtenerClima()` contra `api.open-meteo.com/v1/forecast` con `current`, `daily`, `timezone=auto` y `forecast_days=7`.
  - Render separado en `pintarResultados()`, `pintarActual()` y `pintarPronostico()`; el pronóstico se inserta con `DocumentFragment` para evitar reflows repetidos.
  - Tema persistido en `localStorage` con `prefers-color-scheme` como valor inicial; accesos envueltos en `try/catch` para modo privado.
  - Contador `peticionActual` que descarta respuestas de búsquedas ya superadas.
  - Estados cubiertos: inicial, cargando, entrada vacía, sin resultados y error de red.
- `README.md` — tabla de endpoints y parámetros, estructura de archivos, instrucciones para abrirlo y notas de accesibilidad.
- Comentarios en español en los tres archivos: por función (qué hace, parámetros, retorno), por llamada a la API (endpoint y significado de cada parámetro) y por sección de HTML/CSS. Sin iconos ni emojis en los comentarios.

**Verificación:**

- Servido con `python -m http.server 8000` y probado en navegador.
- Búsqueda de "Bogotá": devuelve clima actual (temperatura, sensación, humedad, viento, descripción) y 7 días de pronóstico.
- Búsqueda de "Springfield": devuelve varias coincidencias y la lista de selección; al elegir una se carga su clima.
- Búsqueda de "asdfgh": muestra mensaje de ciudad no encontrada, sin pantalla en blanco.
- Toggle de modo oscuro: cambia el tema y persiste tras recargar.
- Consola del navegador sin errores.
- Sin `localStorage`, con el sistema en oscuro: arranca en oscuro (`data-theme="dark"`, fondo `rgb(17,19,26)`).
- A 375px de ancho: `scrollWidth` igual a `clientWidth`, sin scroll horizontal.

**Fuera de alcance (no implementado a propósito):** mapas, gráficas, autenticación, service worker, PWA, unidades imperiales.
