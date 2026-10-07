/*
  app.js
  Aqui vive toda la logica de la app. Es JavaScript normal, sin React ni
  librerias: solo lo que el navegador ya trae.

  El recorrido completo es este:
    1. la persona escribe una ciudad y presiona Buscar o Enter
    2. le preguntamos a la API como se llama esa ciudad y donde queda
       (eso devuelve latitud y longitud, o sea las coordenadas)
    3. con esas coordenadas le pedimos a la API el clima
    4. metemos los datos en los huecos vacios del HTML

  Para probarlo hay que levantar un servidor local. En la terminal, parado en
  la carpeta del proyecto:
      python -m http.server 8000
  y luego abrir http://localhost:8000 en el navegador.
*/

/*
  'use strict' activa el modo estricto de JavaScript. En criollo: hace que el
  navegador avise de errores que normalmente deja pasar en silencio, como usar
  una variable que nunca creaste. Dejalo, ayuda mas de lo que estorba.
*/
'use strict';

/* ==========================================================================
   DATOS FIJOS
   Cosas que nunca cambian mientras la app corre. Van arriba para encontrarlas
   rapido y para no tener direcciones de internet regadas por todo el archivo.
   ========================================================================== */

// Primera direccion de la API: le mandas un nombre de ciudad y te devuelve
// sus coordenadas.
const URL_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';

// Segunda direccion: le mandas coordenadas y te devuelve el clima.
const URL_FORECAST = 'https://api.open-meteo.com/v1/forecast';

// Nombre con el que se guarda el tema elegido en el navegador.
// Si lo cambias, la gente que ya habia elegido un tema lo pierde una vez.
const CLAVE_TEMA = 'clima-tema';

/*
  La API no manda textos como "esta lloviendo". Manda un numero, el
  weather_code, que es un codigo estandar de meteorologia (lo define la OMM).
  Esta tabla es la traduccion de ese numero a algo que una persona entienda.
  Si llega un codigo que no esta en la lista, descripcionClima() responde
  "Sin datos" y la app sigue andando igual.
*/
const CODIGOS_WMO = {
  0: 'Cielo despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia fuerte',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada fuerte',
  71: 'Nevada ligera',
  73: 'Nevada moderada',
  75: 'Nevada fuerte',
  77: 'Granos de nieve',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos violentos',
  85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve fuertes',
  95: 'Tormenta electrica',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo fuerte'
};

/* ==========================================================================
   ICONOS
   La API de Open-Meteo no manda imagenes ni animaciones, solo el numero del
   clima. Los dibujos los ponemos nosotros usando Material Symbols, que es la
   libreria de iconos de Google.

   Funciona asi: la fuente se carga desde el <head> del index.html, y para
   mostrar un icono se escribe su nombre dentro de un elemento con la clase
   material-symbols-rounded. La fuente convierte esa palabra en el dibujo.
   Por eso aqui abajo solo hay nombres y no codigo de dibujo.

   Si ves la palabra "rainy" escrita en la pagina en vez del icono, es que la
   fuente de Google no cargo: revisa internet o el link en el index.html.
   ========================================================================== */

/*
  Los ocho iconos que usamos. La palabra de la derecha es el nombre exacto que
  Google le dio al icono; si la escribes mal, no sale nada.
  El catalogo completo esta en fonts.google.com/icons
*/
const ICONOS = {
  despejado: 'sunny',
  noche: 'clear_night',
  parcial: 'partly_cloudy_day',
  nublado: 'cloud',
  niebla: 'foggy',
  lluvia: 'rainy',
  nieve: 'weather_snowy',
  tormenta: 'thunderstorm'
};

/*
  grupoIcono(codigo, esDia)
  Decide que icono le toca a un codigo de clima.
  Recibe:
    codigo (numero)  - el weather_code que mando la API.
    esDia (true o false) - solo sirve para el cielo despejado, para poner sol
                       de dia y luna de noche. El pronostico de los proximos
                       dias siempre manda true, porque la API no dice si cada
                       dia futuro se muestra de dia o de noche.
  Devuelve: el nombre de un grupo, por ejemplo 'lluvia'.

  El orden de los if importa. Van de lo mas especifico a lo mas general, asi
  que si los mueves de lugar puedes terminar con tormentas mostrando lluvia.
*/
function grupoIcono(codigo, esDia) {
  if (codigo === 0) return esDia ? 'despejado' : 'noche';
  if (codigo === 1 || codigo === 2) return 'parcial';
  if (codigo === 3) return 'nublado';
  if (codigo === 45 || codigo === 48) return 'niebla';
  if (codigo >= 95) return 'tormenta';
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'nieve';
  if (codigo >= 51) return 'lluvia';

  // Por si llega un codigo raro que no conocemos: mejor una nube que un hueco.
  return 'nublado';
}

/*
  crearIcono(codigo, esDia)
  Fabrica el elemento del icono listo para meter en la pagina.
  Recibe: lo mismo que grupoIcono().
  Devuelve: un <span> ya con sus clases y su texto.

  Detalles de las clases:
    material-symbols-rounded -> la clase que activa la fuente de Google.
                                Sin ella sale la palabra en letras normales.
    icono--<grupo>           -> la usa styles.css para pintarlo de color y
                                para animarlo.
  aria-hidden esconde el icono de los lectores de pantalla (al lado siempre
  esta el texto), y translate="no" evita que el traductor automatico del
  navegador cambie la palabra y rompa el dibujo.
*/
function crearIcono(codigo, esDia) {
  const grupo = grupoIcono(codigo, esDia);
  const span = document.createElement('span');

  span.className = 'material-symbols-rounded icono icono--' + grupo;
  span.setAttribute('aria-hidden', 'true');
  span.setAttribute('translate', 'no');
  span.textContent = ICONOS[grupo];

  return span;
}

/* ==========================================================================
   LOS ELEMENTOS DEL HTML
   Buscamos una sola vez cada pedazo de la pagina que vamos a tocar y lo
   guardamos en este objeto. Asi no repetimos getElementById cincuenta veces
   y, de paso, queda una lista clara de todo lo que el JS modifica.

   CUIDADO: cada texto entre comillas es un id del index.html. Si cambias un
   id alla y no lo cambias aqui, esa linea devuelve null y la app se cae
   cuando intenta usarla.
   ========================================================================== */
const el = {
  html: document.documentElement,
  metaColor: document.querySelector('meta[name="theme-color"]'),
  btnTema: document.getElementById('btn-tema'),
  btnTemaTexto: document.getElementById('btn-tema-texto'),

  form: document.getElementById('form-busqueda'),
  input: document.getElementById('input-ciudad'),
  btnBuscar: document.getElementById('btn-buscar'),

  resultados: document.getElementById('resultados'),
  resultadosLista: document.getElementById('resultados-lista'),

  estado: document.getElementById('estado'),
  estadoTexto: document.querySelector('#estado .estado__texto'),

  seccionActual: document.getElementById('seccion-actual'),
  actualLugar: document.getElementById('actual-lugar'),
  actualHora: document.getElementById('actual-hora'),
  actualIcono: document.getElementById('actual-icono'),
  actualTemp: document.getElementById('actual-temp'),
  actualDesc: document.getElementById('actual-desc'),
  actualSensacion: document.getElementById('actual-sensacion'),
  actualHumedad: document.getElementById('actual-humedad'),
  actualViento: document.getElementById('actual-viento'),

  seccionPronostico: document.getElementById('seccion-pronostico'),
  pronosticoLista: document.getElementById('pronostico-lista'),

  anio: document.getElementById('anio')
};

/*
  Contador de busquedas.
  El problema que resuelve: si buscas "Lima" y enseguida buscas "Cali", las
  dos respuestas viajan por internet al mismo tiempo y no siempre llegan en
  orden. Sin esto, la respuesta lenta de "Lima" podria pisar la de "Cali".
  Cada busqueda se lleva su numero; cuando llega una respuesta comparamos su
  numero con el ultimo y, si no coincide, la ignoramos.
*/
let peticionActual = 0;

/* ==========================================================================
   TEMA CLARO Y OSCURO
   ========================================================================== */

/*
  temaInicial()
  Decide con que tema abre la pagina.
  No recibe nada. Devuelve el texto 'dark' o 'light'.

  Primero mira si la persona ya eligio un tema antes (eso queda guardado en el
  navegador). Si nunca eligio, usa la configuracion del sistema operativo.

  El try / catch esta porque localStorage lanza error en ventanas de incognito
  o con las cookies bloqueadas, y un error ahi tumbaria toda la app.
*/
function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (guardado === 'dark' || guardado === 'light') return guardado;
  } catch (error) {
    // No se pudo leer. No pasa nada: seguimos con la preferencia del sistema.
  }

  // matchMedia pregunta por la configuracion del sistema. .matches es true si
  // la persona tiene el modo oscuro puesto en su computador o celular.
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/*
  aplicarTema(tema)
  Pone el tema en la pagina y lo deja guardado.
  Recibe: tema (texto) - tiene que ser 'dark' o 'light'.
  No devuelve nada; lo que hace es cambiar cuatro cosas en la pagina.
*/
function aplicarTema(tema) {
  const esOscuro = tema === 'dark';

  // 1. Este atributo es el interruptor. El CSS no mira ninguna otra cosa:
  //    con data-theme="dark" cambian todos los colores de golpe.
  el.html.setAttribute('data-theme', tema);

  // 2. El texto del boton dice a donde vas, no donde estas.
  el.btnTemaTexto.textContent = esOscuro ? 'Modo claro' : 'Modo oscuro';

  // 3. aria-pressed si dice donde estas, que es lo que necesita un lector de
  //    pantalla para anunciar si el boton esta activado.
  el.btnTema.setAttribute('aria-pressed', String(esOscuro));

  // 4. La barrita de arriba del navegador en el celular, para que combine.
  el.metaColor.setAttribute('content', esOscuro ? '#11131a' : '#f4f6fb');

  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch (error) {
    // Si no deja guardar, el tema igual funciona hasta que se cierre la pestana.
  }
}

/* ==========================================================================
   MENSAJES EN PANTALLA
   ========================================================================== */

/*
  mostrarEstado(mensaje, esError)
  Escribe el aviso que ve la persona: "Buscando...", "No encontramos...", etc.
  Recibe:
    mensaje (texto) - lo que se va a mostrar.
    esError (true o false, opcional) - true lo pinta en rojo y en negrita.
  No devuelve nada.
*/
function mostrarEstado(mensaje, esError) {
  el.estadoTexto.textContent = mensaje;

  // toggle con segundo argumento: pone la clase si es true, la quita si es false.
  el.estado.classList.toggle('estado--error', Boolean(esError));
  el.estado.hidden = false;
}

/*
  ocultarEstado()
  Esconde el aviso. Se llama cuando ya se ven los datos del clima y el mensaje
  sobra. No recibe ni devuelve nada.
*/
function ocultarEstado() {
  el.estado.hidden = true;
  el.estado.classList.remove('estado--error');
}

/*
  limpiarClima()
  Esconde el clima que haya en pantalla y vacia la lista de coincidencias.
  No recibe ni devuelve nada.

  Sin esto queda feo de verdad: buscas una ciudad que no existe, sale el error
  en rojo, pero debajo siguen los datos de la ciudad anterior como si fueran
  los buenos.
*/
function limpiarClima() {
  el.seccionActual.hidden = true;
  el.seccionPronostico.hidden = true;
  el.resultados.hidden = true;
  el.resultadosLista.textContent = '';
}

/* ==========================================================================
   ARREGLAR LOS DATOS ANTES DE MOSTRARLOS
   La API manda numeros y fechas crudas. Estas funciones los dejan presentables.
   ========================================================================== */

/*
  descripcionClima(codigo)
  Convierte el numero del clima en texto.
  Recibe: codigo (numero) - el weather_code.
  Devuelve: el texto de la tabla, o 'Sin datos' si el codigo no esta.
*/
function descripcionClima(codigo) {
  return CODIGOS_WMO[codigo] || 'Sin datos';
}

/*
  nombreDia(fechaISO)
  Saca el nombre del dia de la semana a partir de una fecha.
  Recibe: fechaISO (texto) - viene como '2026-10-05'.
  Devuelve: texto, por ejemplo 'lunes'.

  Lo de 'T00:00:00Z' y timeZone UTC parece exagerado, pero sin eso pasa algo
  molesto: en paises con hora atrasada respecto a Londres (como Colombia), el
  navegador interpreta la fecha como la medianoche de alla, la convierte a la
  hora de aca y termina mostrando el dia anterior. Con UTC fijo, no se mueve.
*/
function nombreDia(fechaISO) {
  const fecha = new Date(fechaISO + 'T00:00:00Z');

  // Intl.DateTimeFormat es lo que trae el navegador para traducir fechas.
  // Con 'es' las devuelve en espanol sin que tengamos que escribir la lista.
  return new Intl.DateTimeFormat('es', { weekday: 'long', timeZone: 'UTC' }).format(fecha);
}

/*
  horaLocal(tiempoISO)
  Saca solo la hora y los minutos de la marca de tiempo del clima actual.
  Recibe: tiempoISO (texto) - viene como '2026-10-05T15:30'.
  Devuelve: texto '15:30', o texto vacio si llega algo raro.

  Aqui no se usa new Date() a proposito. La API ya nos manda la hora de la
  ciudad consultada (por el parametro timezone=auto), asi que convertirla otra
  vez la cambiaria a la hora de quien esta mirando la pagina. Partir el texto
  por la letra T es mas simple y no mueve nada.
*/
function horaLocal(tiempoISO) {
  if (typeof tiempoISO !== 'string' || tiempoISO.indexOf('T') === -1) return '';
  return tiempoISO.split('T')[1].slice(0, 5);
}

/*
  redondear(valor)
  Quita los decimales para que no salga "19.4°C".
  Recibe: valor (numero) - puede llegar null si la API no tiene ese dato.
  Devuelve: el numero redondeado como texto, o un guion si no habia numero.
*/
function redondear(valor) {
  return typeof valor === 'number' ? String(Math.round(valor)) : '—';
}

/* ==========================================================================
   HABLAR CON LA API
   Las dos funciones son async, o sea que tardan: piden algo por internet y
   hay que esperar la respuesta. Por eso quien las llama usa await.
   ========================================================================== */

/*
  buscarCiudades(nombre)
  Le pregunta a la API que ciudades se llaman asi y donde quedan.
  Recibe: nombre (texto) - lo que la persona escribio.
  Devuelve: una lista de ciudades. Puede venir vacia si no hubo coincidencias.

  Lo que se le manda a la API:
    name     -> el nombre a buscar.
    count    -> cuantas coincidencias queremos como maximo. Pusimos 5.
    language -> idioma en el que devuelve los nombres.
    format   -> el formato de la respuesta, json.

  URLSearchParams arma la parte de la direccion que va despues del signo de
  interrogacion y, de paso, escapa los acentos y los espacios. Si lo pegaras a
  mano, buscar "San Andres" romperia la direccion por el espacio.
*/
async function buscarCiudades(nombre) {
  const parametros = new URLSearchParams({
    name: nombre,
    count: '5',
    language: 'es',
    format: 'json'
  });

  // fetch es la funcion del navegador para pedir cosas por internet.
  const respuesta = await fetch(URL_GEOCODING + '?' + parametros.toString());

  // respuesta.ok es false cuando el servidor contesta con un error (404, 500...).
  // Lanzamos el error para que lo agarre el try / catch de quien nos llamo.
  if (!respuesta.ok) throw new Error('Geocoding respondio ' + respuesta.status);

  const datos = await respuesta.json();

  // Detalle de esta API: cuando no encuentra nada, no manda una lista vacia,
  // sino que directamente no manda la propiedad results. Por eso revisamos
  // que exista antes de usarla.
  return Array.isArray(datos.results) ? datos.results : [];
}

/*
  obtenerClima(latitud, longitud)
  Pide el clima de unas coordenadas.
  Recibe:
    latitud (numero)  - la que vino del geocoding.
    longitud (numero) - igual.
  Devuelve: el objeto completo que manda la API, con dos bloques adentro:
    current -> el clima de ahora mismo
    daily   -> una lista por cada uno de los 7 dias

  Lo que se le manda a la API:
    latitude y longitude -> de que punto del mundo queremos el clima.
    current  -> que datos del momento queremos: temperatura, humedad,
                sensacion termica, viento, codigo del clima e is_day
                (1 si es de dia, 0 si es de noche) para el sol o la luna.
    daily    -> que datos por dia: codigo del clima, maxima, minima y
                probabilidad de lluvia.
    timezone=auto   -> que las horas vengan en la hora de esa ciudad y no en
                       la del computador de quien mira.
    forecast_days=7 -> cuantos dias queremos.

  Si quitas una variable de current o de daily, la pagina deja de mostrar ese
  dato y sale el guion en su lugar.
*/
async function obtenerClima(latitud, longitud) {
  const parametros = new URLSearchParams({
    latitude: String(latitud),
    longitude: String(longitud),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7'
  });

  const respuesta = await fetch(URL_FORECAST + '?' + parametros.toString());
  if (!respuesta.ok) throw new Error('Forecast respondio ' + respuesta.status);

  return respuesta.json();
}

/* ==========================================================================
   PINTAR COSAS EN LA PAGINA
   ========================================================================== */

/*
  pintarResultados(ciudades)
  Arma la lista de botones cuando varias ciudades se llaman igual.
  Recibe: ciudades (lista) - lo que devolvio buscarCiudades().
  No devuelve nada. Cada boton que crea queda listo para pedir su clima.
*/
function pintarResultados(ciudades) {
  // Vaciar primero, si no se van acumulando los resultados de cada busqueda.
  el.resultadosLista.textContent = '';

  ciudades.forEach(function (ciudad) {
    const item = document.createElement('li');

    const boton = document.createElement('button');
    // type="button" es obligatorio aqui. Por defecto un boton dentro de un
    // form es de tipo submit, y al hacer clic volveria a enviar la busqueda.
    boton.type = 'button';
    boton.className = 'resultados__boton';

    // El nombre de la ciudad.
    const nombre = document.createElement('span');
    nombre.textContent = ciudad.name;

    // La region y el pais, para distinguir el Cali de Colombia del de Filipinas.
    const detalle = document.createElement('span');
    detalle.className = 'resultados__pais';
    // filter(Boolean) saca los valores vacios, porque no toda ciudad trae region.
    const partes = [ciudad.admin1, ciudad.country].filter(Boolean);
    detalle.textContent = partes.length ? ' — ' + partes.join(', ') : '';

    boton.appendChild(nombre);
    boton.appendChild(detalle);

    // Al hacer clic se cierra la lista y se pide el clima de esa ciudad.
    boton.addEventListener('click', function () {
      el.resultados.hidden = true;
      cargarClima(ciudad);
    });

    item.appendChild(boton);
    el.resultadosLista.appendChild(item);
  });

  el.resultados.hidden = false;
}

/*
  pintarActual(ciudad, clima)
  Llena la tarjeta grande del clima de ahora.
  Recibe:
    ciudad (objeto) - la que vino del geocoding, con name, admin1 y country.
    clima (objeto)  - la respuesta entera de obtenerClima().
  No devuelve nada.
*/
function pintarActual(ciudad, clima) {
  const actual = clima.current;

  // La API tambien manda las unidades (°C, km/h). El || {} es un seguro por
  // si no vinieran, para que la linea de abajo no reviente al leerlas.
  const unidades = clima.current_units || {};

  // Titulo con ciudad, region y pais, saltandose los que vengan vacios.
  const lugar = [ciudad.name, ciudad.admin1, ciudad.country].filter(Boolean);
  el.actualLugar.textContent = lugar.join(', ');

  const hora = horaLocal(actual.time);
  el.actualHora.textContent = hora ? 'Actualizado ' + hora : '';

  // El icono. is_day llega como 1 o 0, no como true o false, por eso se compara
  // contra 1 para convertirlo.
  el.actualIcono.textContent = '';
  el.actualIcono.appendChild(crearIcono(actual.weather_code, actual.is_day === 1));

  el.actualTemp.textContent = redondear(actual.temperature_2m) + (unidades.temperature_2m || '°C');
  el.actualDesc.textContent = descripcionClima(actual.weather_code);

  el.actualSensacion.textContent = redondear(actual.apparent_temperature) + (unidades.apparent_temperature || '°C');
  el.actualHumedad.textContent = redondear(actual.relative_humidity_2m) + '%';
  el.actualViento.textContent = redondear(actual.wind_speed_10m) + ' ' + (unidades.wind_speed_10m || 'km/h');

  // Hasta aqui la seccion estaba escondida. Ahora si se muestra.
  el.seccionActual.hidden = false;
}

/*
  pintarPronostico(clima)
  Crea una tarjeta por cada dia de la semana.
  Recibe: clima (objeto) - la respuesta entera de obtenerClima().
  No devuelve nada.

  Ojo con como viene el bloque daily: no es una lista de dias, sino varias
  listas sueltas del mismo largo. O sea, el dia 3 es time[2], weather_code[2],
  temperature_2m_max[2] y asi. Por eso se recorre con el indice i.
*/
function pintarPronostico(clima) {
  const diario = clima.daily;
  const unidades = clima.daily_units || {};
  const grados = unidades.temperature_2m_max || '°C';

  // Un fragmento es como una bandeja invisible: armamos los 7 dias ahi y los
  // metemos en la pagina de una sola vez. Si los metieramos uno por uno, el
  // navegador recalcularia el diseno siete veces.
  const fragmento = document.createDocumentFragment();

  diario.time.forEach(function (fecha, i) {
    const item = document.createElement('li');
    item.className = 'dia';

    // Icono del dia. Siempre la version de dia, porque el bloque daily no trae
    // is_day: no tiene sentido preguntar si el proximo jueves es de dia.
    const icono = document.createElement('div');
    icono.className = 'dia__icono';
    icono.appendChild(crearIcono(diario.weather_code[i], true));

    // Lunes, martes, miercoles...
    const nombre = document.createElement('p');
    nombre.className = 'dia__nombre';
    nombre.textContent = nombreDia(fecha);

    // El texto del clima de ese dia.
    const desc = document.createElement('p');
    desc.className = 'dia__desc';
    desc.textContent = descripcionClima(diario.weather_code[i]);

    // Maxima y minima en la misma linea. La maxima va en negrita, pero eso lo
    // decide el CSS con la clase dia__max.
    const temps = document.createElement('p');
    temps.className = 'dia__temps';

    const max = document.createElement('span');
    max.className = 'dia__max';
    max.textContent = redondear(diario.temperature_2m_max[i]) + grados;

    const min = document.createElement('span');
    min.className = 'dia__min';
    min.textContent = ' / ' + redondear(diario.temperature_2m_min[i]) + grados;

    temps.appendChild(max);
    temps.appendChild(min);

    // Probabilidad de lluvia de ese dia.
    const lluvia = document.createElement('p');
    lluvia.className = 'dia__lluvia';
    lluvia.textContent = 'Lluvia ' + redondear(diario.precipitation_probability_max[i]) + '%';

    // El orden de estos appendChild es el orden en que se ven en la tarjeta.
    item.appendChild(icono);
    item.appendChild(nombre);
    item.appendChild(desc);
    item.appendChild(temps);
    item.appendChild(lluvia);
    fragmento.appendChild(item);
  });

  el.pronosticoLista.textContent = '';
  el.pronosticoLista.appendChild(fragmento);
  el.seccionPronostico.hidden = false;
}

/* ==========================================================================
   LAS DOS FUNCIONES QUE COORDINAN TODO
   ========================================================================== */

/*
  cargarClima(ciudad)
  Pide el clima de una ciudad que ya tiene coordenadas y lo muestra.
  Recibe: ciudad (objeto) - tiene que traer latitude y longitude.
  Devuelve: una promesa. Los errores los maneja ella misma mostrando un aviso,
  asi que quien la llama no necesita envolverla en try / catch.
*/
async function cargarClima(ciudad) {
  // Nos quedamos con el numero de esta busqueda para compararlo al final.
  const token = ++peticionActual;

  mostrarEstado('Cargando clima de ' + ciudad.name + '…');
  el.seccionActual.hidden = true;
  el.seccionPronostico.hidden = true;

  try {
    const clima = await obtenerClima(ciudad.latitude, ciudad.longitude);

    // Mientras esperabamos, la persona busco otra cosa. Esta respuesta ya no
    // sirve, asi que nos salimos sin pintar nada.
    if (token !== peticionActual) return;

    pintarActual(ciudad, clima);
    pintarPronostico(clima);
    ocultarEstado();
  } catch (error) {
    if (token !== peticionActual) return;

    // Algo fallo: sin internet, la API caida, lo que sea. Limpiamos para no
    // dejar encima los datos de la busqueda anterior y mostramos el aviso.
    limpiarClima();
    mostrarEstado('No se pudo obtener el clima. Revisa tu conexion e intenta de nuevo.', true);
  }
}

/*
  manejarBusqueda(evento)
  Es lo que se ejecuta cuando alguien envia el formulario.
  Recibe: evento - lo manda el navegador solo, no hay que pasarselo.
  Devuelve: una promesa.

  evento.preventDefault() es imprescindible. Por defecto, enviar un formulario
  recarga la pagina entera, y perderiamos todo lo que ibamos a mostrar.
*/
async function manejarBusqueda(evento) {
  evento.preventDefault();

  // trim() quita los espacios de los lados. Suena a detalle tonto, pero cuando
  // alguien pega el nombre de una ciudad casi siempre viene con un espacio.
  const nombre = el.input.value.trim();
  const token = ++peticionActual;

  // Campo vacio: avisamos y devolvemos el cursor al input para no obligar a
  // buscarlo con el mouse.
  if (!nombre) {
    limpiarClima();
    mostrarEstado('Escribe el nombre de una ciudad.', true);
    el.input.focus();
    return;
  }

  limpiarClima();
  mostrarEstado('Buscando "' + nombre + '"…');

  try {
    const ciudades = await buscarCiudades(nombre);

    if (token !== peticionActual) return;

    // Caso 1: no existe ninguna ciudad asi, o esta mal escrita.
    if (ciudades.length === 0) {
      mostrarEstado('No encontramos ninguna ciudad llamada "' + nombre + '". Revisa la escritura.', true);
      return;
    }

    // Caso 2: una sola. No tiene sentido hacer elegir entre una opcion.
    if (ciudades.length === 1) {
      cargarClima(ciudades[0]);
      return;
    }

    // Caso 3: varias. Que la persona diga cual.
    pintarResultados(ciudades);
    mostrarEstado('Encontramos ' + ciudades.length + ' coincidencias. Elige una de la lista.');
  } catch (error) {
    if (token !== peticionActual) return;
    mostrarEstado('No se pudo completar la busqueda. Revisa tu conexion e intenta de nuevo.', true);
  }
}

/* ==========================================================================
   ARRANQUE
   Estas lineas son las unicas que se ejecutan solas al cargar la pagina. Todo
   lo de arriba son definiciones que esperan a ser llamadas.
   Van al final porque usan funciones que tienen que estar ya declaradas.
   ========================================================================== */

// Pone el tema antes de que se vea nada, para que no parpadee.
aplicarTema(temaInicial());

// El ano del copyright, sacado del reloj del computador.
el.anio.textContent = String(new Date().getFullYear());

// Boton del tema: mira como esta ahora y pone el contrario.
el.btnTema.addEventListener('click', function () {
  const actual = el.html.getAttribute('data-theme');
  aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

// Escuchar el submit del form cubre las dos formas de buscar: el clic en el
// boton y la tecla Enter dentro del campo. Por eso no hace falta un listener
// aparte para el teclado.
el.form.addEventListener('submit', manejarBusqueda);
