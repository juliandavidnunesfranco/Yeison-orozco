# Clima — web app con Open-Meteo

Web app para consultar el clima actual y el pronóstico de 7 días de cualquier ciudad.
Hecha solo con **HTML, CSS y JavaScript vanilla**: sin frameworks, sin npm, sin dependencias que instalar y sin API key.

## Qué necesitas para correrlo

| Requisito | Para qué | Obligatorio |
|---|---|---|
| Un navegador actual (Chrome, Edge, Firefox o Safari) | Abrir la app | Sí |
| Conexión a internet | La API del clima y los iconos de Google se piden en línea | Sí |
| Python 3 | Levantar el servidor local | Recomendado |

No hay que instalar librerías, no hay `npm install` y no hay que compilar nada.

Python no es obligatorio: también puedes abrir `index.html` con doble clic, porque la API de Open-Meteo permite peticiones desde cualquier origen. Aun así conviene usar el servidor local, que es como se comporta el proyecto en un entorno real.

### Validar que tienes lo necesario

Abre una terminal en la carpeta del proyecto y corre:

```bash
python --version
```

Si responde algo como `Python 3.14.7`, ya está. Si dice que no reconoce el comando, prueba:

```bash
py --version
```

En Windows, para ver dónde quedó instalado:

```bash
where python
```

Si ninguno responde, descarga Python desde [python.org/downloads](https://www.python.org/downloads/) y marca la casilla **Add Python to PATH** durante la instalación.

¿No quieres instalar Python? Con Node.js ya instalado también sirve:

```bash
npx serve .
```

## Cómo levantarlo

Parado en la carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador. Para detener el servidor, `Ctrl + C` en la terminal.

Si el puerto 8000 está ocupado, cambia el número:

```bash
python -m http.server 8080
```

## Funcionalidad

- Búsqueda de ciudad por nombre. Si hay varias coincidencias, muestra la lista para elegir.
- Tarjeta de clima actual: temperatura, sensación térmica, humedad, viento, descripción e icono.
- Pronóstico de 7 días: día de la semana, icono, máxima, mínima y probabilidad de lluvia.
- Modo oscuro con botón manual, guardado en el navegador y con la configuración del sistema como valor inicial.
- Estados de interfaz: inicial, cargando, sin resultados y error de conexión.

## Endpoints usados

### 1. Geocoding — nombre de ciudad a coordenadas

```
GET https://geocoding-api.open-meteo.com/v1/search
```

| Parámetro | Valor | Para qué |
|---|---|---|
| `name` | texto del usuario | nombre a buscar |
| `count` | `5` | máximo de coincidencias |
| `language` | `es` | idioma de los nombres devueltos |
| `format` | `json` | formato de respuesta |

Devuelve `results[]` con `latitude`, `longitude`, `name`, `admin1`, `country`. Si no hay coincidencias, omite `results` en vez de devolver una lista vacía.

### 2. Forecast — clima para unas coordenadas

```
GET https://api.open-meteo.com/v1/forecast
```

| Parámetro | Valor | Para qué |
|---|---|---|
| `latitude` / `longitude` | coordenadas | ubicación de la consulta |
| `current` | `temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day` | datos del momento actual |
| `daily` | `weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` | datos por día |
| `timezone` | `auto` | horas en la zona de la ciudad, no la del navegador |
| `forecast_days` | `7` | una semana de pronóstico |

El campo `weather_code` es un código WMO numérico. La traducción a texto en español está en la tabla `CODIGOS_WMO` de `app.js`.

El parámetro `is_day` (1 de día, 0 de noche) solo decide si el cielo despejado se muestra con sol o con luna.

## Iconos

Open-Meteo no entrega imágenes ni animaciones, solo el número `weather_code`. Los iconos son los **Material Symbols de Google**, cargados como fuente desde el `<link>` del `<head>`. Para mostrar uno se escribe su nombre dentro de un elemento con la clase `material-symbols-rounded` y la fuente lo convierte en el dibujo.

`grupoIcono()` agrupa los códigos WMO en ocho iconos:

| Códigos WMO | Icono de Google |
|---|---|
| 0 (de día) | `sunny` |
| 0 (de noche) | `clear_night` |
| 1, 2 | `partly_cloudy_day` |
| 3 | `cloud` |
| 45, 48 | `foggy` |
| 51–67, 80–82 | `rainy` |
| 71–77, 85, 86 | `weather_snowy` |
| 95–99 | `thunderstorm` |

El catálogo completo está en [fonts.google.com/icons](https://fonts.google.com/icons). Si ves la palabra del icono escrita en vez del dibujo, es que la fuente no cargó: revisa la conexión o el `<link>` del `index.html`.

Las animaciones (sol girando, nube de lluvia flotando, tormenta parpadeando) usan solo `transform` y `opacity`, y se apagan con `prefers-reduced-motion`.

## Estructura

```
jeissonOrozco_WEB/
├── index.html      Estructura y secciones de la interfaz
├── styles.css      Variables de tema, layout, componentes e iconos
├── app.js          Llamadas a la API, render y manejo de tema
├── README.md
└── CHANGELOG.md
```

## Accesibilidad

- Foco visible en todo elemento enfocable y enlace "Saltar al contenido".
- Áreas táctiles de 44px mínimo y `font-size: 16px` en el input para evitar el zoom automático de iOS.
- Mensajes de carga y error anunciados con `aria-live="polite"`.
- `aria-pressed` en el botón de tema y `color-scheme: dark` en modo oscuro.
- Iconos con `aria-hidden`, porque la descripción en texto va al lado.

## Datos

Datos meteorológicos de [Open-Meteo](https://open-meteo.com/), de uso gratuito para fines no comerciales.
