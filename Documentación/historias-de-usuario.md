# Historias de Usuario — Tiquetera

Roles: RESTAURANTE, CLIENTE.

> Historias multi-restaurante (SUPER_ADMIN): ver `HistoriasDeUsuarioMultiRestaurante.md`.

---

## RESTAURANTE

### HU-R1. Inicio de sesión

Como RESTAURANTE,
quiero iniciar sesión con mi cuenta,
con el fin de acceder a mi panel de gestión.

### HU-R2. Registro de clientes

Como RESTAURANTE,
quiero registrar clientes con nombre, identificación y teléfono,
con el fin de asociarlos a las tiqueteras que adquieran.

### HU-R3. Creación de tiquetera

Como RESTAURANTE,
quiero crear tiqueteras asociadas a un cliente definiendo el total de almuerzos adquiridos,
con el fin de generar el código de activación que entregaré al cliente.

### HU-R4. Consulta y filtrado de tiqueteras

Como RESTAURANTE,
quiero listar y filtrar tiqueteras por cliente y estado (PENDIENTE, ACTIVA, FINALIZADA),
con el fin de consultar el estado de las tiqueteras vendidas.

### HU-R5. Apertura de tiquetera por QR

Como RESTAURANTE,
quiero escanear o ingresar el token del QR de una tiquetera,
con el fin de abrir la vista de carga del cliente correspondiente.

### HU-R6. Validación de PIN del cliente

Como RESTAURANTE,
quiero solicitar e ingresar el PIN del cliente antes de mostrar la tiquetera,
con el fin de autorizar la operación de descuento.

### HU-R7. Visualización de la rejilla de almuerzos

Como RESTAURANTE,
quiero ver la rejilla de almuerzos con cuadros disponibles y consumidos diferenciados,
con el fin de visualizar el saldo y la fecha de cada consumo.

### HU-R8. Registro de consumo

Como RESTAURANTE,
quiero seleccionar cuadros en la rejilla y confirmar la operación,
con el fin de descontar almuerzos validando PIN, estado de la tiquetera y saldo disponible.

### HU-R9. Corrección de consumo del mismo día

Como RESTAURANTE,
quiero deseleccionar un cuadro consumido dentro del mismo día calendario,
con el fin de corregir un consumo mal registrado generando una reversa visible en el historial.

### HU-R10. Consulta del historial de movimientos

Como RESTAURANTE,
quiero ver el historial de consumos y reversas de una tiquetera,
con el fin de consultar los movimientos realizados por día.

### HU-R11. Gestión de usuarios del restaurante

Como RESTAURANTE,
quiero crear cuentas de usuario con nombre, correo y contraseña,
con el fin de que los miembros del equipo accedan al panel.

### HU-R12. Entrega del código de activación

Como RESTAURANTE,
quiero copiar o compartir el código de activación de una tiquetera en estado PENDIENTE,
con el fin de entregarlo al cliente para que active su tiquetera.

---

## CLIENTE

### HU-C1. Activación de tiquetera

Como CLIENTE,
quiero activar mi tiquetera ingresando el código de activación recibido del restaurante,
con el fin de habilitar mi código QR sin necesidad de crear una cuenta.

### HU-C2. Creación de PIN personal

Como CLIENTE,
quiero crear mi PIN de 6 dígitos al momento de activar mi tiquetera,
con el fin de proteger el consumo de mis almuerzos con una credencial que el restaurante no conoce.

### HU-C3. Regeneración de PIN

Como CLIENTE,
quiero regenerar mi PIN de 6 dígitos cuando lo decida,
con el fin de renovar mi credencial de autorización e invalidar la anterior.

### HU-C4. Descarga y conservación del QR

Como CLIENTE,
quiero descargar la imagen de mi código QR y copiar su URL de consulta,
con el fin de conservarlo en mi dispositivo y presentarlo al momento de consumir.

### HU-C5. Consulta de saldo e historial

Como CLIENTE,
quiero abrir la URL de mi QR desde cualquier navegador,
con el fin de ver mi saldo (total, consumidos y disponibles) y mi historial de movimientos por día sin necesidad de cuenta.
