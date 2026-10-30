"""
Ejemplo 2 · Crear una ficha como coordinador — con código (Python + Selenium WebDriver)

Abre AsistenciaApp en Chrome, inicia sesión como coordinador y, desde el
panel, entra a Fichas y crea una ficha nueva. Al final comprueba que la ficha
aparece en la tabla. Entre cada paso espera unos segundos (PAUSA) para que se
alcance a ver lo que hace Selenium.

Uso (desde esta carpeta):
    python ejemplo2_codigo.py
"""
import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

URL = os.environ.get("APP_URL", "https://asistenciaapp.onrender.com")
CORREO = "admin@sena.edu.co"  # cuenta de demostración del coordinador
CONTRASENA = "Admin123*"
PAUSA = 2  # segundos de espera entre cada paso

# Datos de la ficha nueva. El número no se puede repetir: se arma con la hora
# para que cada ejecución cree una distinta (9 + 6 cifras)
NUMERO_FICHA = "9" + str(int(time.time()))[-6:]
PROGRAMA = "Análisis y Desarrollo de Software"
JORNADA = "Tarde"
FECHA_INICIO = "18012027"  # 18/01/2027, se escribe como día mes año
FECHA_FIN = "15122028"     # 15/12/2028
PERIODO = "2026-2"
INSTRUCTOR = "Cristian Buitrago"

opciones = webdriver.ChromeOptions()
# Chrome en español: los campos de fecha esperan día/mes/año
opciones.add_argument("--lang=es")
navegador = webdriver.Chrome(options=opciones)
navegador.maximize_window()
# Render gratis duerme el servidor sin uso: la primera visita puede tardar ~1 minuto
espera = WebDriverWait(navegador, 90)

try:
    # 1. Abrir el link de la aplicación
    print(f"1. Abriendo {URL}")
    navegador.get(URL)
    campo_correo = espera.until(EC.visibility_of_element_located((By.ID, "login-correo")))
    time.sleep(PAUSA)

    # 2. Iniciar sesión como coordinador
    print(f"2. Iniciando sesión como coordinador ({CORREO})")
    campo_correo.send_keys(CORREO)
    time.sleep(PAUSA)
    navegador.find_element(By.ID, "login-contrasena").send_keys(CONTRASENA)
    time.sleep(PAUSA)
    navegador.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    espera.until(EC.url_contains("/panel"))
    espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Coordinador"))
    print("   Entró al panel")
    time.sleep(PAUSA)

    # 3. Desde el panel, entrar a "Fichas" en el menú
    print("3. Entrando a Fichas desde el menú")
    espera.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='/fichas']"))).click()
    time.sleep(PAUSA)

    # 4. Abrir el formulario "+ Nueva ficha"
    print("4. Abriendo el formulario + Nueva ficha")
    espera.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nueva ficha')]"))).click()
    time.sleep(PAUSA)

    # 5. Llenar el formulario, campo por campo
    print(f"5. Número de ficha: {NUMERO_FICHA}")
    espera.until(EC.visibility_of_element_located((By.ID, "ficha-numero"))).send_keys(NUMERO_FICHA)
    time.sleep(PAUSA)

    print(f"   Jornada: {JORNADA}")
    Select(navegador.find_element(By.ID, "ficha-jornada")).select_by_visible_text(JORNADA)
    time.sleep(PAUSA)

    print(f"   Programa: {PROGRAMA}")
    navegador.find_element(By.ID, "ficha-programa").send_keys(PROGRAMA)
    time.sleep(PAUSA)

    print("   Fecha de inicio: 18/01/2027")
    navegador.find_element(By.ID, "ficha-inicio").send_keys(FECHA_INICIO)
    time.sleep(PAUSA)

    print("   Fecha de fin: 15/12/2028")
    navegador.find_element(By.ID, "ficha-fin").send_keys(FECHA_FIN)
    time.sleep(PAUSA)

    # Los periodos y los instructores llegan del servidor: se espera a que carguen
    print(f"   Periodo: {PERIODO}")
    espera.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='ficha-periodo']/option[normalize-space()='{PERIODO}']")))
    Select(navegador.find_element(By.ID, "ficha-periodo")).select_by_visible_text(PERIODO)
    time.sleep(PAUSA)

    print(f"   Instructor titular: {INSTRUCTOR}")
    espera.until(EC.presence_of_element_located((By.XPATH, f"//select[@id='ficha-instructor']/option[normalize-space()='{INSTRUCTOR}']")))
    Select(navegador.find_element(By.ID, "ficha-instructor")).select_by_visible_text(INSTRUCTOR)
    time.sleep(PAUSA)

    # 6. Clic en "Crear ficha"
    print("6. Clic en Crear ficha")
    navegador.find_element(By.XPATH, "//button[text()='Crear ficha']").click()

    # 7. Comprobar: sale el aviso "Ficha creada" y la ficha aparece en la tabla
    espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Ficha creada"))
    fila = espera.until(EC.visibility_of_element_located((By.XPATH, f"//tr[td/b[text()='{NUMERO_FICHA}']]")))
    navegador.execute_script("arguments[0].scrollIntoView({block: 'center'})", fila)  # la deja a la vista
    print(f"7. La ficha aparece en la tabla: {fila.text.splitlines()[0]}")
    time.sleep(PAUSA)

    print(f"\nPRUEBA SUPERADA: el coordinador creó la ficha {NUMERO_FICHA}")
    time.sleep(5)  # unos segundos más para ver el resultado antes de cerrar
finally:
    navegador.quit()
