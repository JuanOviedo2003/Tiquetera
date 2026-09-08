# REQUISITOS Y MODELO DE DATOS — TIQUETERA WEB

## 1. CONTEXTO

Sistema web para restaurantes que venden almuerzos por tiquetera. El restaurante crea tiqueteras con un código de activación. El cliente activa su tiquetera desde cualquier navegador, obtiene su código QR y un PIN personal. Para consumir, el cliente presenta su QR al restaurante, ingresa su PIN, y el restaurante descuenta almuerzos seleccionando cuadros en una rejilla visual. Todo desde la web del restaurante, sin app móvil. El cliente consulta su saldo desde la URL de su QR, sin necesidad de cuenta.

## 2. REQUISITOS FUNCIONALES

### RF-01. Registro de clientes
El sistema debe permitir al restaurante registrar clientes capturando nombre completo, número de identificación y un teléfono de contacto opcional. Cada cliente queda vinculado al restaurante que lo registró.

### RF-02. Registro de usuarios del restaurante
El sistema debe permitir crear cuentas de acceso al panel del restaurante con un rol único de RESTAURANTE. Cada cuenta tiene nombre, correo electrónico (único), contraseña encriptada y estado activo/inactivo.

### RF-03. Autenticación de usuarios
El sistema debe exigir inicio de sesión para acceder a cualquier función de gestión (clientes, tiqueteras, consumos). Las rutas protegidas deben rechazar peticiones no autenticadas, incluyendo intentos de acceso directo desde la vista pública del cliente.

### RF-04. Creación de tiquetera con código de activación
El sistema debe permitir crear una tiquetera asociada a un cliente específico definiendo la cantidad total de almuerzos adquiridos. La tiquetera nace en estado PENDIENTE y se genera automáticamente un código de activación de 6 dígitos, aleatorio, de un solo uso y con tiempo de expiración (48 horas). El código puede reemitirse si vence sin haberse activado.

### RF-05. Activación de tiquetera desde el cliente
El sistema debe ofrecer una página pública donde el cliente ingresa el código de activación recibido del restaurante. Al ingresarlo correctamente, la tiquetera cambia a estado ACTIVA, se genera el código QR único e inmutable, y se le solicita al cliente crear un PIN de 6 dígitos como credencial personal de autorización. La página de activación no requiere creación de cuenta.

### RF-06. Regeneración de PIN por parte del cliente
El sistema debe permitir al cliente regenerar su PIN de 6 dígitos en cualquier momento desde la vista pública de su tiquetera, mediante un botón dedicado. El PIN anterior deja de funcionar de inmediato. El restaurante nunca tiene acceso al PIN en texto plano; solo se almacena como hash.

### RF-07. Código QR único e inmutable
El sistema debe generar un identificador único (`qr_token`) por tiquetera, vinculado al código QR. Este token no cambia durante toda la vida útil de la tiquetera, sin importar consumos, regeneraciones de PIN o reenvíos del QR.

### RF-08. Descarga y conservación del QR
El sistema debe permitir al cliente descargar la imagen de su código QR y copiar la URL de consulta de su tiquetera desde la vista de activación, para conservarlo en su dispositivo.

### RF-09. Panel de gestión del restaurante (rejilla de consumo)
El sistema debe ofrecer una consola exclusiva para el restaurante autenticado donde, al ingresar o escanear el `qr_token` de una tiquetera, se le solicite el PIN del cliente. Al validar el PIN, se muestra: nombre del cliente, teléfono de contacto y una rejilla visual donde cada cuadro representa un almuerzo. Los cuadros disponibles se muestran en un color diferenciado y los ya consumidos en otro. El restaurante selecciona los cuadros correspondientes a la cantidad a consumir y confirma la operación.

### RF-10. Registro de consumo
El sistema debe registrar el descuento de almuerzos cuando el restaurante selecciona cuadros en la rejilla y confirma la operación. Cada registro almacena: tiquetera afectada, cantidad consumida, fecha y hora del servidor, y usuario del restaurante que realizó la operación. La operación solo se ejecuta si la tiquetera está ACTIVA, el PIN es correcto y la cantidad seleccionada no excede los almuerzos disponibles.

### RF-11. Actualización automática de saldos
El sistema debe recalcular automáticamente los almuerzos consumidos y disponibles de una tiquetera después de cada movimiento registrado (consumo o reversa), sin intervención manual.

### RF-12. Validación de saldo y estado
El sistema debe impedir el registro de un consumo cuya cantidad supere los almuerzos disponibles. También debe bloquear cualquier operación sobre tiqueteras en estado FINALIZADA o PENDIENTE.

### RF-13. Finalización automática de tiquetera
El sistema debe cambiar automáticamente el estado de una tiquetera de ACTIVA a FINALIZADA cuando sus almuerzos disponibles lleguen a cero, registrando la fecha y hora de finalización. Una tiquetera FINALIZADA no admite nuevos consumos.

### RF-14. Corrección de consumo del mismo día
El sistema debe permitir al restaurante deseleccionar un cuadro consumido únicamente dentro del mismo día calendario en que se registró. Esta acción genera un registro de reversa con fecha_hora, usuario y referencia al consumo original. El movimiento queda visible en el historial; nada se elimina.

### RF-15. Historial de movimientos
El sistema debe almacenar y mostrar el historial completo de movimientos de cada tiquetera: consumos y reversas, ordenados cronológicamente, con filtro por día. El restaurante ve el historial desde la consola autenticada; el cliente lo ve desde su vista pública de solo lectura.

### RF-16. Vista pública del cliente
El sistema debe ofrecer una página web accesible directamente desde la URL del QR, sin login, que muestre de solo lectura: nombre del cliente, estado de la tiquetera, almuerzos totales, consumidos y disponibles, y el historial de movimientos agrupado por día.

### RF-17. Consulta y filtrado de tiqueteras
El sistema debe permitir al restaurante listar y buscar tiqueteras con filtros por nombre de cliente, estado (PENDIENTE, ACTIVA, FINALIZADA) y fecha de creación.

### RF-18. Control de acceso por capas
El sistema debe garantizar que la consola de gestión (rejilla, descuentos, creación de tiqueteras) solo sea accesible desde cuentas autenticadas del restaurante. Las peticiones provenientes de la vista pública del cliente que intenten modificar datos deben ser rechazadas por el servidor, independientemente del formato de la petición.

## 3. REQUISITOS NO FUNCIONALES

### RNF-01. Accesibilidad web y diseño responsive
La aplicación debe funcionar íntegramente desde un navegador web, sin instalación. La interfaz debe ser responsive y adaptarse correctamente a computadores de escritorio, tablets y teléfonos móviles. La experiencia en móvil es prioritaria dado que tanto el restaurante como el cliente operan desde sus dispositivos.

### RNF-02. Separación de vistas por rol
Las funciones de gestión (crear tiqueteras, registrar consumos, administrar clientes) deben requerir sesión activa del restaurante. La vista del cliente debe ser pública, de solo lectura, accesible únicamente mediante la URL que contiene el `qr_token`. Ninguna acción de escritura debe estar disponible en la vista pública.

### RNF-03. Separación de identificación y saldo
El código QR debe contener únicamente el identificador `qr_token`. El saldo, el historial y cualquier dato sensible deben residir exclusivamente en la base de datos. El QR es un indicador de identidad, no un portador de información.

### RNF-04. Persistencia e integridad de datos
Todos los consumos, reversas y movimientos deben almacenarse de forma permanente con fecha y hora generadas por el servidor. Los registros nunca deben eliminarse físicamente.

### RNF-05. Tiempo de respuesta
La consulta de una tiquetera mediante escaneo o ingreso del `qr_token` debe completarse en un máximo de 3 segundos bajo condiciones normales de uso y carga.

### RNF-06. Seguridad de códigos y credenciales
Los códigos de activación deben ser aleatorios, no predecibles y no consecutivos. Deben expirar tras 48 horas y permitir un solo uso. Tanto los códigos de activación como los PIN deben tener un límite de intentos fallidos antes de bloquearse temporalmente. Los PIN deben almacenarse exclusivamente como hash irreversible.

### RNF-07. Mínimo expuesto en vista pública
La vista pública del cliente debe mostrar únicamente los datos necesarios para su consulta: nombre, estado, saldos y movimientos de su tiquetera. No debe exponer datos de otros clientes, del restaurante, ni del usuario que registró los consumos.

### RNF-08. Separación de rutas por función
La aplicación debe mantener rutas separadas e independientes para la consola del restaurante (autenticada) y la vista pública del cliente. Esto garantiza que un cliente no pueda acceder a funciones de gestión sin importar cómo construya las peticiones.

## 4. FUERA DEL MVP

- Integración con API de WhatsApp (envío automático de notificaciones).
- Cuentas o sesiones para clientes.
- Vencimiento de tiqueteras por fecha de calendario.
- Reservación de días específicos para consumo.
- Pagos en línea o integración con pasarelas de pago.
- Multi-restaurante (cada instancia es un solo restaurante).
