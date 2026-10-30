"""
Ejemplo 1 · Selenium con código (Python)

Abre AsistenciaApp en Chrome, inicia sesión con la cuenta del coordinador y
comprueba que entró al panel.

Uso (desde esta carpeta):
    pip install -r requirements.txt
    python ejemplo1_iniciar_sesion.py

Para probar otra dirección, por ejemplo la app en tu computador (Windows):
    set APP_URL=http://localhost:8080
    python ejemplo1_iniciar_sesion.py
"""
import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

URL = os.environ.get("APP_URL", "https://asistenciaapp.onrender.com")
CORREO = "admin@sena.edu.co"  # cuenta de demostración del coordinador
CONTRASENA = "Admin123*"

# Selenium busca o descarga solo el chromedriver que corresponde a tu Chrome
navegador = webdriver.Chrome()
navegador.maximize_window()
# Render gratis duerme el servidor sin uso: la primera visita puede tardar ~1 minuto
espera = WebDriverWait(navegador, 90)

try:
    # 1. Abrir el link de la aplicación
    print(f"1. Abriendo {URL}")
    navegador.get(URL)

    # 2. Escribir el correo y la contraseña
    print("2. Escribiendo correo y contraseña")
    campo_correo = espera.until(EC.visibility_of_element_located((By.ID, "login-correo")))
    campo_correo.send_keys(CORREO)
    navegador.find_element(By.ID, "login-contrasena").send_keys(CONTRASENA)

    # 3. Clic en "Iniciar sesión"
    print("3. Clic en Iniciar sesión")
    navegador.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    # 4. Comprobar que entró: la dirección cambia a /panel y el saludo lleva su nombre
    espera.until(EC.url_contains("/panel"))
    espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Coordinador"))
    saludo = navegador.find_element(By.TAG_NAME, "h1").text
    print(f"4. Entró al panel: «{saludo}»")

    print("\nPRUEBA SUPERADA: el usuario inició sesión y llegó al panel")
    time.sleep(5)  # unos segundos para ver el resultado en pantalla
finally:
    navegador.quit()
