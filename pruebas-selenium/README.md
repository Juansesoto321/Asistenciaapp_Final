# Pruebas con Selenium

Dos ejemplos, hechos de dos formas:

| Ejemplo | Con código (Python) | Con la extensión de Chrome (Selenium IDE) |
|---|---|---|
| 1 · Abrir el link e iniciar sesión | `ejemplo1_iniciar_sesion.py` | prueba *Ejemplo 1 - Iniciar sesion* de `AsistenciaApp.side` |
| 2 · Lo mismo y, desde el panel, crear una ficha (rol coordinador) | `ejemplo2_crear_ficha.py` | prueba *Ejemplo 2 - Crear ficha (coordinador)* de `AsistenciaApp.side` |

Las dos formas abren la versión publicada, **https://asistenciaapp.onrender.com**, con la
cuenta de demostración del coordinador (`admin@sena.edu.co` / `Admin123*`).

> Render gratis duerme el servidor cuando nadie lo usa: la primera visita puede tardar
> cerca de un minuto. Las pruebas esperan hasta 90 segundos antes de dar error.

## 1. Con código (Python)

Necesitas Python 3.9 o superior y Google Chrome. Desde esta carpeta:

```bash
pip install -r requirements.txt
python ejemplo1_iniciar_sesion.py
python ejemplo2_crear_ficha.py
```

Chrome se abre solo, escribe los datos y hace los clics. En la consola va saliendo cada
paso y al final `PRUEBA SUPERADA`. Si algo falla, Selenium muestra el error y la línea.
No hay que descargar el chromedriver: Selenium lo busca solo.

Para probar otra dirección, por ejemplo la app de Docker en tu computador:

```bash
set APP_URL=http://localhost:8080
python ejemplo1_iniciar_sesion.py
```

(En PowerShell: `$env:APP_URL="http://localhost:8080"`.)

## 2. Con la extensión de Chrome (Selenium IDE)

1. Instala **Selenium IDE** desde la Chrome Web Store:
   https://chromewebstore.google.com/detail/selenium-ide/mooikfkahbdckldjjndioackbalphokd
2. Haz clic en el ícono **Se** de la barra de extensiones.
3. Elige **Open an existing project** y abre `AsistenciaApp.side`.
4. A la izquierda elige una prueba y pulsa **Run current test** (▷), o **Run all tests**
   para correr las dos.
5. Cada paso se pone en verde y en el **Log** de abajo sale `PRUEBA SUPERADA`.

Detalles del archivo:

- Las fechas se llenan con `execute script`: el campo de fecha cambia de formato según el
  idioma de Chrome (día/mes/año o mes/día/año) y así funciona en cualquiera.
- El número de ficha no se puede repetir, así que se arma con la hora y se guarda en la
  variable `numeroFicha`.
- Para grabar una prueba propia: **Record a new test in a new project**, escribe la
  dirección de la app, usa la aplicación normalmente y pulsa **Stop**.

Si la tienda no deja instalar la extensión, la versión de escritorio de Selenium IDE
(https://github.com/SeleniumHQ/selenium-ide/releases) abre el mismo archivo `.side`.

El mismo archivo también corre sin abrir la extensión, desde la consola (necesita Node):

```bash
npx selenium-side-runner AsistenciaApp.side
```

## Qué datos dejan

El ejemplo 2 crea una ficha **de verdad** en la base de la aplicación que se prueba. En la
versión publicada no hay problema: es una base de demostración. No lo corras contra la
instalación real con `APP_URL` si no quieres que esa ficha quede allí.
