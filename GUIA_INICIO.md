# 🚀 Guía Completa de Arranque Manual y Setup desde GitHub - BarberApp

Este documento explica paso a paso cómo arrancar el sistema **BarberApp** en cualquier computadora (o después de descargarlo desde un repositorio de GitHub), cómo correrlo en **PC (Navegador Web)** y en **Teléfono Móvil (Expo Go)**, y qué dependencias deben instalarse.

---

## 📦 1. Qué dependencias instalar (Si bajás el proyecto de GitHub o lo abrís en otra PC)

Cuando subís el proyecto a GitHub, las carpetas `node_modules` **no se suben** (porque son muy pesadas y van en el `.gitignore`). Al descargarlo o clonarlo, tenés que instalar las librerías necesarias ejecutando estos comandos:

### A. Dependencias del Backend (`c:\aplicativos\backend`)
Abrí una terminal en la carpeta `backend` y corré:
```powershell
cd c:\aplicativos\backend
npm install
```
*Librerías principales que instalará de forma automática basándose en `package.json`:*
- **`express`**: Framework web para crear la API REST y las rutas del servidor.
- **`mongoose`**: ORM para conectar y consultar fácilmente la base de datos MongoDB.
- **`bcryptjs`**: Para encriptar y comparar contraseñas de forma segura (hash).
- **`jsonwebtoken` (JWT)**: Para generar los tokens de autenticación al iniciar sesión.
- **`cors`**: Permite que la app móvil y la web se conecten con la API sin bloqueos de seguridad.
- **`dotenv`**: Para leer variables de entorno como puertos, claves secretas y URIs de base de datos (`.env`).
- **`node-cron`**: Para ejecutar tareas programadas automáticas (ej. recordatorios cada hora).
- **`nodemailer`**: Para el envío automático de correos de confirmación y rechazo.

---

### B. Dependencias de la App Móvil / Web (`c:\aplicativos\mobile-app`)
Abrí otra terminal en la carpeta `mobile-app` y corré:
```powershell
cd c:\aplicativos\mobile-app
npm install
```
*(Y opcionalmente si querés asegurar compatibilidad total con el SDK de Expo)*:
```powershell
npx expo install
```
*Librerías principales que instalará basándose en `package.json`:*
- **`expo`**: Framework principal de React Native que permite compilar para Web, Android e iOS.
- **`react` & `react-native`**: Núcleo de la interfaz gráfica y componentes de usuario.
- **`react-native-web`**: Convierte los componentes nativos de React Native en etiquetas HTML/CSS para que funcione perfectamente en el navegador de tu PC.
- **`@react-navigation/native` & `@react-navigation/bottom-tabs` & `@react-navigation/stack`**: Sistema de navegación por pestañas y transiciones entre pantallas.
- **`axios`**: Cliente HTTP para realizar las peticiones al servidor backend (`GET`, `POST`, `PUT`, `DELETE`).
- **`@react-native-async-storage/async-storage`**: Almacenamiento local del dispositivo para guardar el token de sesión y los datos del usuario logueado.
- **`react-native-safe-area-context` & `react-native-screens`**: Manejo de márgenes seguros en pantallas modernas de celulares (notches).

---

## 🖥️ 2. Cómo Arrancar el Sistema Manualmente (Paso a Paso)

Para que el sistema funcione, siempre deben ejecutarse **dos procesos en paralelo**: el **Backend (Servidor)** y el **Frontend (Expo/React Native)**.

### Paso 1: Encender la Base de Datos y el Backend
1. Asegurate de que el servicio de **MongoDB** esté activo en tu PC (se inicia solo con Windows, o ejecutando `net start MongoDB` desde PowerShell como Administrador).
2. Abrí una terminal y ejecutá:
   ```powershell
   cd c:\aplicativos\backend
   node index.js
   ```
3. Verificá que en la consola aparezca:
   ```
   🚀 Servidor listo en: http://localhost:5000
   ✅ CONECTADO A MONGODB CON ÉXITO
   ```
   *(Dejá esta ventana abierta en segundo plano).*

---

### Paso 2: Arrancar la Interfaz Web para PC (Google Chrome)
Si querés usar el sistema desde la computadora (con el diseño ajustado tipo panel ejecutivo y centrado):
1. Abrí una **segunda terminal** en la carpeta móvil:
   ```powershell
   cd c:\aplicativos\mobile-app
   npx expo start --web
   ```
2. Se abrirá automáticamente una pestaña de **Google Chrome** en la dirección `http://localhost:8081`.
3. Ya podés iniciar sesión con la cuenta de administrador (`admin@peluqueria.com` / `admin1234`) o crear una cuenta de cliente para probar.

---

### Paso 3: Arrancar la App desde el Celular (Expo Go)
Si querés probar la aplicación desde tu teléfono móvil real (o mostrarla en clase desde tu celular):
1. Conectá tu teléfono celular a la **misma red Wi-Fi** a la que está conectada tu computadora.
2. Averiguá la dirección IP local de tu PC ejecutando en PowerShell:
   ```powershell
   ipconfig
   ```
   *(Buscá el campo "Dirección IPv4", por ejemplo: `192.168.100.2` o `192.168.1.15`)*.
3. Abrí el archivo `c:\aplicativos\mobile-app\src\config\api.js` y asegurate de que la variable apunte a tu IP real o sea dinámica:
   ```javascript
   // Si tu IP es por ejemplo 192.168.100.2:
   export const API_URL = 'http://192.168.100.2:5000/api';
   ```
4. En la terminal de la aplicación móvil (`c:\aplicativos\mobile-app`), ejecutá:
   ```powershell
   npx expo start --host lan
   ```
5. En tu celular, abrí la aplicación **Expo Go** (descargable gratis desde Play Store o App Store).
6. Escaneá el **Código QR** que aparece en la pantalla de la computadora. ¡Y listo! La app se abrirá en tu celular con el tamaño original 100% diseñado para dispositivos móviles.

---

## ⚡ 3. El Atajo Rápido (El archivo `INICIAR_SISTEMA.bat`)
Para evitar escribir todos estos comandos cada vez que prendés la computadora, el proyecto incluye un archivo automatizado en la raíz: **`INICIAR_SISTEMA.bat`**.

Al hacerle **doble clic** a ese archivo:
1. Detecta automáticamente tu IP local en la red Wi-Fi.
2. Lanza el servidor backend en el puerto `5000` en una ventana separada.
3. Espera 4 segundos a que conecte la base de datos MongoDB.
4. Abre automáticamente Google Chrome en la vista de PC y enciende el empaquetador de Expo para que puedas escanear el QR desde el celular al mismo tiempo.
