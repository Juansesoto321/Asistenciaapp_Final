"""
Ejemplo 1 · Iniciar sesión — con código (Python + Selenium WebDriver)

Abre AsistenciaApp en Chrome, inicia sesión con la cuenta del coordinador y
comprueba que entró al panel. Entre cada paso espera unos segundos (PAUSA)
para que se alcance a ver lo que hace Selenium.

Uso (desde esta carpeta):
    python ejemplo1_codigo.py
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
PAUSA = 2  # segundos de espera entre cada paso

# Selenium busca o descarga solo el chromedriver que corresponde a tu Chrome
navegador = webdriver.Chrome()
navegador.maximize_window()
# Render gratis duerme el servidor sin uso: la primera visita puede tardar ~1 minuto
espera = WebDriverWait(navegador, 90)

try:
    # 1. Abrir el link de la aplicación
    print(f"1. Abriendo {URL}")
    navegador.get(URL)
    campo_correo = espera.until(EC.visibility_of_element_located((By.ID, "login-correo")))
    time.sleep(PAUSA)

    # 2. Escribir el correo
    print(f"2. Escribiendo el correo: {CORREO}")
    campo_correo.send_keys(CORREO)
    time.sleep(PAUSA)

    # 3. Escribir la contraseña
    print("3. Escribiendo la contraseña")
    navegador.find_element(By.ID, "login-contrasena").send_keys(CONTRASENA)
    time.sleep(PAUSA)

    # 4. Clic en "Iniciar sesión"
    print("4. Clic en Iniciar sesión")
    navegador.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    # 5. Comprobar que entró: la dirección cambia a /panel y el saludo lleva su nombre
    espera.until(EC.url_contains("/panel"))
    espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "h1"), "Coordinador"))
    saludo = navegador.find_element(By.TAG_NAME, "h1").text
    print(f"5. Entró al panel: «{saludo}»")
    time.sleep(PAUSA)

    print("\nPRUEBA SUPERADA: el usuario inició sesión y llegó al panel")
    time.sleep(5)  # unos segundos más para ver el resultado antes de cerrar
finally:
    navegador.quit()
