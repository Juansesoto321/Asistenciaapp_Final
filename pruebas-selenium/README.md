# Pruebas con Selenium · Guía para la exposición

Somos dos personas y cada una presenta **un ejemplo**, mostrado de **dos formas**: con
código y con la extensión de Chrome.

| | Persona 1 | Persona 2 |
|---|---|---|
| Ejemplo | Abrir el link e iniciar sesión | Lo mismo y, desde el panel, crear una ficha (rol coordinador) |
| Carpeta | `ejemplo1_iniciar_sesion/` | `ejemplo2_crear_ficha/` |
| Con código (Python) | `ejemplo1_codigo.py` | `ejemplo2_codigo.py` |
| Con la extensión (Selenium IDE) | `ejemplo1_extension.side` | `ejemplo2_extension.side` |
| Duración aproximada | 12 segundos | 35 segundos |

Los cuatro abren la versión publicada, **https://asistenciaapp.onrender.com**, con la
cuenta de demostración del coordinador (`admin@sena.edu.co` / `Admin123*`). Entre un paso
y otro esperan **2 segundos** para que la clase alcance a ver qué hace Selenium.

---

## Antes de la clase (en el computador donde van a exponer)

1. **Descargar los archivos.** En https://github.com/Juansesoto321/Asistenciaapp_Final:
   botón **Code → Download ZIP**, descomprimir y abrir la carpeta `pruebas-selenium`.
2. **Instalar Python** (https://www.python.org/downloads/). En el instalador, marcar
   **Add python.exe to PATH**.
3. **Instalar Selenium para Python.** En una terminal, dentro de `pruebas-selenium`:
   ```bash
   pip install -r requirements.txt
   ```
4. **Instalar la extensión Selenium IDE** en Google Chrome:
   https://chromewebstore.google.com/detail/selenium-ide/mooikfkahbdckldjjndioackbalphokd
   y fijarla en la barra (ícono de rompecabezas → chincheta junto a *Selenium IDE*).
5. **Ensayar una vez los cuatro.** Si algo falla, revisar la sección *Si algo falla*.
6. **Plan B:** grabar la pantalla del ensayo (Windows: `Win + Alt + R` con la Xbox Game
   Bar). Si en clase falla el internet, se muestra el video.
7. **5 minutos antes de exponer:** abrir https://asistenciaapp.onrender.com en el
   navegador. Render gratis duerme el servidor cuando nadie lo usa y tarda cerca de un
   minuto en despertar; así, en la exposición responde de inmediato.

---

## Introducción (para decir al empezar)

> Selenium es una herramienta que **controla un navegador como si fuera una persona**:
> abre páginas, escribe, hace clic y comprueba que el resultado sea el esperado. Sirve
> para hacer **pruebas automáticas de la interfaz**: en vez de probar a mano cada vez que
> cambiamos algo, Selenium repite los pasos solo.
>
> Hay dos formas de usarlo:
> - **Con código (Selenium WebDriver):** se escribe un programa, en nuestro caso en Python.
> - **Con la extensión de Chrome (Selenium IDE):** se graban o escriben los pasos en una
>   lista, sin programar, y la extensión los reproduce.

---

## Persona 1 · Ejemplo 1: iniciar sesión

### A. Con código

1. Abrir `ejemplo1_iniciar_sesion/ejemplo1_codigo.py` en VS Code y explicar:
   - Arriba están **la dirección de la app, el correo, la contraseña y `PAUSA = 2`**
     (los segundos de espera entre pasos).
   - `webdriver.Chrome()` **abre Chrome**; Selenium consigue solo el driver que necesita.
   - Cada campo se encuentra **por su `id`**: `login-correo` y `login-contrasena`.
   - `send_keys` **escribe** y `click` **hace clic**.
   - Al final **comprueba** que la dirección cambió a `/panel` y que el saludo dice
     *Coordinador*. Si no, la prueba falla.
2. Abrir una terminal en la carpeta y ejecutar:
   ```bash
   cd ejemplo1_iniciar_sesion
   python ejemplo1_codigo.py
   ```
3. Se abre Chrome solo. Mostrar que en la consola va saliendo cada paso y al final
   **`PRUEBA SUPERADA`**. Chrome se cierra solo a los pocos segundos.

### B. Con la extensión

1. En Chrome, clic en el ícono **Se** (Selenium IDE).
2. **Open an existing project** → abrir `ejemplo1_iniciar_sesion/ejemplo1_extension.side`.
3. Mostrar la lista de pasos y explicar cada columna:
   - **Command** (qué hace): `open` abre la página, `type` escribe, `click` hace clic,
     `pause` espera 2000 milisegundos, `assert…` comprueba.
   - **Target** (dónde): el campo, por ejemplo `id=login-correo`.
   - **Value** (qué escribe): el correo o la contraseña.
4. Clic en **Run current test** (▷). Se abre una ventana de Chrome y cada paso se va
   poniendo **en verde**.
5. Abajo, en **Log**, sale **`PRUEBA SUPERADA`**.

---

## Persona 2 · Ejemplo 2: crear una ficha como coordinador

### A. Con código

1. Abrir `ejemplo2_crear_ficha/ejemplo2_codigo.py` y explicar:
   - Es **el mismo inicio de sesión del ejemplo 1** y después sigue en la aplicación.
   - Arriba están **los datos de la ficha**. El número no se puede repetir, por eso se
     arma con la hora: cada vez que se corre crea una ficha distinta.
   - `--lang=es` abre Chrome en español, porque así las fechas se escriben día/mes/año.
   - Las listas desplegables (jornada, periodo, instructor) se llenan con `Select`.
   - Selenium **espera** a que el periodo y el instructor lleguen del servidor antes de
     elegirlos.
   - Al final comprueba que sale el aviso **Ficha creada** y que la ficha está en la tabla.
2. Ejecutar:
   ```bash
   cd ejemplo2_crear_ficha
   python ejemplo2_codigo.py
   ```
3. Mostrar cómo entra al panel, va a **Fichas**, abre **+ Nueva ficha**, llena campo por
   campo y la ficha nueva aparece en la tabla. En la consola sale **`PRUEBA SUPERADA`**
   con el número de la ficha.

### B. Con la extensión

1. Clic en **Se** → **Open an existing project** → `ejemplo2_crear_ficha/ejemplo2_extension.side`.
   (Si la extensión ya tiene abierto el ejemplo 1, usar el ícono de carpeta, *Open project*,
   arriba a la derecha.)
2. Explicar lo nuevo frente al ejemplo 1:
   - `select` elige una opción de una lista desplegable (`label=Tarde`).
   - `execute script` corre una línea de JavaScript. Se usa para **inventar el número de
     ficha** (queda en la variable `numeroFicha`) y para **llenar las fechas**, porque el
     formato del campo de fecha cambia según el idioma del Chrome de cada computador.
   - `wait for element…` espera a que algo aparezca antes de seguir.
3. **Run current test** (▷) y mostrar los pasos en verde, la ficha nueva en la tabla y
   **`PRUEBA SUPERADA`** en el Log.

---

## Ajustar la espera entre pasos

- **Código:** cambiar `PAUSA = 2` al principio del archivo (por ejemplo `PAUSA = 3`).
- **Extensión:** cada comando `pause` tiene `2000` (milisegundos) en *Target*. También
  se puede bajar la velocidad con el ícono del velocímetro (*Test execution speed*).

## Si algo falla

| Qué pasa | Qué hacer |
|---|---|
| La página tarda mucho en abrir | El servidor estaba dormido: esperar. Las pruebas aguantan hasta 90 segundos. |
| `python` no se reconoce | Reinstalar Python marcando *Add python.exe to PATH*, o usar `py` en vez de `python`. |
| `No module named selenium` | Correr `pip install -r requirements.txt` en la carpeta `pruebas-selenium`. |
| Chrome pregunta si guardar la contraseña | Cerrar el aviso; no afecta la prueba. |
| La tienda no deja instalar la extensión | La versión de escritorio de Selenium IDE (https://github.com/SeleniumHQ/selenium-ide/releases) abre los mismos archivos `.side`. |
| No hay internet en el salón | Mostrar el video del plan B. |

Para probar otra dirección, por ejemplo la app de Docker en el computador:
`set APP_URL=http://localhost:8080` (en PowerShell: `$env:APP_URL="http://localhost:8080"`)
antes de `python …`.

Los archivos `.side` también corren sin abrir la extensión, desde la consola (necesita
Node): `npx selenium-side-runner ejemplo1_iniciar_sesion/ejemplo1_extension.side`.

## Qué datos dejan

El ejemplo 2 crea una ficha **de verdad** en la base de la aplicación. En la versión
publicada no hay problema: es una base de demostración. No lo corran contra la
instalación real con `APP_URL` si no quieren que esa ficha quede allí.
