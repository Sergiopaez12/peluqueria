# 🏛️ Arquitectura y Funcionalidad de Archivos - BarberApp

Este documento es una guía técnica completa que explica la arquitectura general del sistema y detalla **la funcionalidad específica de cada archivo del Backend y del Frontend**. Está diseñado como referencia clara para explicarle y defender el proyecto ante un profesor o tribunal académico.

---

## 🏗️ Arquitectura General del Sistema

El sistema utiliza una arquitectura **Cliente-Servidor (REST API)** separada en dos capas principales:
1. **Capa Backend (Node.js + Express + MongoDB)**: Encargada de la lógica de negocio, validaciones, seguridad con tokens encriptados y acceso a la base de datos no relacional.
2. **Capa Frontend (React Native / Expo Multiplataforma)**: Interfaz de usuario adaptable y responsiva, que se compila a web (HTML5/CSS/JS) cuando corre en PC (`React Native Web`) o a componentes nativos en dispositivos Android/iOS a través de `Expo Go`.

---

## ⚙️ 1. ARCHIVOS DEL BACKEND (`c:\aplicativos\backend`)

El servidor sigue un patrón clásico **MVC simplificado (Modelos - Controladores - Rutas)**.

### 📌 Archivo Principal de Entrada
* **`index.js`**
  - **Función:** Es el punto de partida y corazón del servidor.
  - **Qué hace:** Conecta a la base de datos de MongoDB utilizando Mongoose, configura los middleware globales (como `CORS` para permitir tráfico y `Express.json` para procesar cuerpos de petición HTTP), registra todas las rutas (`/api/auth`, `/api/turnos`, `/api/servicios`, etc.), enciende la labor programada de recordatorios automáticos (`node-cron`) e inicializa datos por defecto (como la creación de los horarios base y la cuenta del Administrador si no existían).

---

### 📂 Carpeta de Modelos (`/models`)
Definen la estructura, tipos de datos, relaciones y validaciones exactas de las colecciones que se guardan en MongoDB.
* **`Usuario.js`**: Esquema de usuarios del sistema. Guarda `nombre`, `email` (único), `password` (que siempre se almacena encriptada con Bcrypt) y el `rol` (`'cliente'` o `'admin'`).
* **`Turno.js`**: Esquema de las reservas. Almacena `usuarioId` (referencia al usuario que reservó, opcional para soportar turnos antiguos), nombre del `cliente`, `servicio`, `fecha` (YYYY-MM-DD), `hora` (HH:MM), y el `estado` (`'pendiente'`, `'confirmado'`, `'rechazado'`).
* **`Servicio.js`**: Catálogo de cortes o servicios de peluquería. Guarda el `nombre` del corte, `precio`, `duracionMin` (duración en minutos), descripción y si está `activo` o no.
* **`HorarioConfig.js`**: Configuración semanal de atención de la barbería. Registra qué días (Lunes a Domingo) están activos (`activo: true/false`), y las horas de apertura y cierre (`horaInicio`, `horaFin`).
* **`DiaBloqueado.js`**: Fechas específicas en las que la barbería no atenderá (feriados, vacaciones o días de descanso extraordinarios). Guarda el campo `fecha` y un `motivo`.
* **`Resena.js`**: Calificaciones y opiniones que dejan los clientes. Relaciona un `usuarioId` y un `turnoId` con una `puntuacion` (1 a 5 estrellas) y un `comentario`.

---

### 📂 Carpeta de Controladores (`/controllers`)
Contienen la **lógica de negocio pura** que se ejecuta cuando un usuario llama a una ruta de la API.
* **`authControllers.js`**:
  - `registrar` / `login`: Validaciones de contraseñas, encriptación con Bcrypt y generación de tokens de seguridad JWT (`JsonWebToken`).
  - `perfil` / `editarPerfil`: Permite obtener los datos propios y cambiar el nombre o contraseña de forma segura.
  - `eliminarCuenta`: Borrado irreversible de la cuenta del cliente junto con todos sus turnos asociados en la base de datos.
  - `getEstadisticas`: Calcula métricas en tiempo real para el panel de administración (total de clientes, turnos confirmados/pendientes/rechazados, servicios más populares, e ingresos económicos estimados).
  - `getClientes` / `eliminarCliente`: Gestión administrativa del listado de clientes registrados.
* **`turnoControllers.js`**:
  - `obtenerTurnos`: Si quien consulta es administrador, devuelve **todos** los turnos de la barbería; si es un cliente normal, filtra para devolver únicamente **sus propios turnos**.
  - `crearTurno`: Valida que el cliente no tenga otro turno a la misma hora exacta, que la barbería esté abierta ese día y registra la reserva.
  - `cambiarEstado`: Permite al administrador aprobar (`confirmado`) o denegar (`rechazado`) una solicitud de turno y dispara emails de notificación.
  - `eliminarTurno` / `reagendarTurno`: Borrado de turnos o modificación de fecha/hora.
* **`servicioControllers.js`**: CRUD completo (Crear, Leer, Actualizar y Eliminar) del catálogo de servicios y precios para que el administrador pueda modificarlos en vivo sin tocar código.
* **`horarioControllers.js`**:
  - `getSlots`: **El motor inteligente del calendario**. Dada una fecha (ej. `2026-07-25`), este controlador verifica si es un día bloqueado o si la barbería abre ese día de la semana. Si está abierta, genera bloques de 30 minutos entre la hora de apertura y cierre, busca en MongoDB qué turnos ya están reservados para ese día, e indica qué horarios exactos están `disponibles: true` y cuáles están ocupados.
  - `getConfig` / `updateConfig` / `bloquearDia`: Manejo de los horarios y excepciones de la barbería.
* **`resenaControllers.js`**: Procesa la creación y lectura de opiniones. Verifica que un cliente solo pueda calificar turnos que efectivamente se hayan completado/confirmado.

---

### 📂 Carpeta de Rutas (`/routes`)
Enrutan las peticiones HTTP (GET, POST, PUT, DELETE) hacia el controlador correcto y aplican las protecciones de seguridad necesarias.
* **`authRoutes.js`**: Rutas públicas (`/login`, `/register`) y protegidas (`/perfil`, `/estadisticas`, `/clientes`).
* **`turnosRoutes.js`**: Rutas para solicitar, ver y cambiar el estado de los turnos (`/api/turnos`).
* **`servicioRoutes.js`**: Endpoints del catálogo de precios (`/api/servicios`).
* **`horarioRoutes.js`**: Rutas para consultar slots disponibles y configurar horarios (`/api/horarios`).
* **`resenaRoutes.js`**: Endpoints para leer el promedio de estrellas y enviar reseñas (`/api/resenas`).

---

### 📂 Carpeta de Intermediarios (`/middleware`)
* **`authMiddleware.js`**:
  - `verificarToken`: Intercepta la petición HTTP antes de llegar al controlador. Extrae el token `Bearer JWT` de la cabecera, verifica su firma criptográfica y rechaza peticiones fraudulentas o expiradas (401 No Autorizado).
  - `soloAdmin`: Verifica que el usuario que intenta ejecutar una acción tenga el campo `rol === 'admin'`. Si un usuario normal intenta acceder a estadísticas o modificar precios, le bloquea el paso (403 Prohibido).

---

## 📱 2. ARCHIVOS DE LA APP MÓVIL Y WEB (`c:\aplicativos\mobile-app\src`)

La interfaz está construida de forma modular, dividiendo la configuración global, el manejo de sesión (Context) y las pantallas individuales.

### 📌 Configuración y Estructura Raíz
* **`App.js`**: Componente raíz de toda la interfaz. Envuelve la aplicación en el proveedor de sesión (`AuthProvider`) y la estructura de área segura (`SafeAreaProvider`). Además, **inyecta dinámicamente estilos CSS web (`zoom: 0.92` y `max-width: 1350px`)** si detecta que el sistema se está ejecutando desde un navegador de PC (`Platform.OS === 'web'`), logrando un diseño ejecutivo en monitores sin afectar la vista nativa de teléfonos móviles.
* **`/config/api.js`**: Archivo estratégico que define la constante `API_URL`. Detecta automáticamente la plataforma: en navegadores web apunta a `http://localhost:5000/api` o al host dinámico, y en móviles se configura con la dirección IP local del servidor (`192.168.x.x`) para permitir la comunicación inalámbrica.
* **`/constants/theme.js`**: **Sistema de Diseño (Design Tokens)**. Centraliza toda la paleta de colores (`Navy`): fondos azul noche (`#060D1F`), superficies (`#0D1B35`), acentos celeste neón (`#38BDF8`), tipografías e indicadores de éxito/error. Garantiza coherencia visual en las 13 pantallas.

---

### 🧠 Gestión del Estado Global y Navegación
* **`/context/AuthContext.js`**: El cerebro de la sesión de usuario. Utiliza `React Context` y `AsyncStorage`. Al abrir la app, verifica si hay un token guardado en el teléfono o navegador. Si existe, restaura la sesión al instante sin pedir clave de nuevo. Brinda a toda la app las funciones `login(email, password)` y `logout()`.
* **`/navigation/AppNavigator.js`**: Define el diagrama de navegación de la aplicación basándose en el rol:
  - **Si no estás logueado**: Muestra el Stack público (Pantallas de `Login` y `Registro`).
  - **Si sos Cliente (`rol === 'cliente'`)**: Muestra la barra inferior de pestañas (*Bottom Tabs*) con 4 secciones: **Mis Turnos**, **Agendar**, **Calificar** y **Mi Perfil**.
  - **Si sos Administrador (`rol === 'admin'`)**: Muestra las pestañas ejecutivas del panel de control: **Panel (Metrics)**, **Turnos (Admin)**, **Calendario**, **Servicios**, **Horarios**, **Clientes** y **Perfil**.
  - **Seguridad Web:** Incluye un interceptor (`popstate`) que detecta si el usuario presiona el botón "Atrás" del navegador en la pantalla principal para cerrar sesión de forma segura y evitar volver a pantallas protegidas por caché.

---

### 🖥️ Pantallas Públicas y de Autenticación (`/screens`)
* **`LoginScreen.js`**: Formulario de ingreso. Valida email/contraseña, llama al endpoint de inicio de sesión y guarda el token recibido en el Context.
* **`RegisterScreen.js`**: Formulario para crear nuevos usuarios clientes. Solicita nombre, email y contraseña con validación en vivo.

---

### 👥 Pantallas del Rol Cliente (`/screens`)
* **`AgendarScreen.js`**: **El centro de reservas del cliente**. Implementa una interfaz de 3 pasos:
  1. Selección visual del servicio de peluquería (mostrando precio y duración).
  2. **Calendario Mensual Interactivo (`◄ Julio 2026 ►`)**: Permite navegar entre meses, bloquea/tacha días pasados y resalta la fecha seleccionada.
  3. Al tocar un día, consulta al backend en tiempo real por los bloques libres (`slots`) y permite confirmar la reserva o re-agendar un turno existente.
* **`TurnosScreen.js` ("Mis Turnos")**: Lista todas las reservas del cliente con una barra superior de filtros por pastillas (*Todos | Pendientes | Confirmados*). Muestra estados con colores e incluye botones para cancelar reservas pendientes.
* **`ResenasScreen.js` ("Calificar")**: Muestra el promedio general de estrellas de la barbería y opiniones de otros usuarios. Si el cliente entra directo desde el menú inferior, **le carga automáticamente sus turnos confirmados** y le muestra botones de selección para que pueda elegir cuál de sus cortes quiere puntuar con de 1 a 5 estrellas y comentario.
* **`PerfilScreen.js` ("Mi Perfil")**: Muestra el avatar con iniciales del usuario, permite editar el nombre, cambiar la contraseña con doble verificación y ofrece la opción de **"Eliminar Cuenta"** (con confirmación web-safe multinavegador/móvil).

---

### 👔 Pantallas del Rol Administrador (`/screens`)
* **`AdminDashboardScreen.js` ("Panel Admin")**: El tablero ejecutivo para el dueño de la barbería. Consulta el endpoint de estadísticas y dibuja tarjetas de resumen rápidas (*Total Clientes, Turnos Pendientes/Confirmados*) junto con gráficos de barra visuales que muestran los servicios más pedidos y el volumen de turnos de los últimos 7 días.
* **`AdminTurnosScreen.js` ("Gestión de Turnos")**: El centro de control operativo del peluquero. Muestra la totalidad de turnos de todos los clientes de la barbería, ordenados por fecha y hora. Incluye botones de acción directa compatibles con PC (`confirm` web y `Alert` móvil) para **[✅ Confirmar]**, **[❌ Rechazar]** o **[🗑️ Eliminar]** cualquier turno.
* **`AdminCalendarioScreen.js` ("Calendario Semanal")**: Vista de agenda estilo línea de tiempo (*Timeline*). Muestra los 7 días de la semana actual en pestañas horizontales y al seleccionar un día presenta las horas ordenadas cronológicamente con la información de qué cliente se atiende y qué servicio solicitó.
* **`AdminServiciosScreen.js` ("Servicios y Precios")**: Panel ABM/CRUD del catálogo de precios. Permite al administrador tocar el botón `[+]` para abrir un modal/formulario e ingresar nuevos cortes, o tocar `[✏️ Editar]` / `[🗑️ Eliminar]` en servicios existentes para actualizar tarifas en tiempo real.
* **`AdminHorariosScreen.js` ("Configuración de Horarios")**: Permite configurar el horario de apertura y cierre para cada día de la semana (*Lunes a Domingo*) con interruptores (`toggle switches`), y cuenta con una sección para agregar **"Días Bloqueados"** (feriados o vacaciones) seleccionando una fecha en formato calendario.
* **`AdminClientesScreen.js` ("Cartera de Clientes")**: Muestra el listado completo de clientes registrados en el sistema, con un buscador superior por nombre o email, indicando cuántos turnos ha tomado cada persona en la historia de la barbería y permitiendo depurar cuentas inactivas.
