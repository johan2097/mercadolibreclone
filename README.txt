COMPRAFÁCIL COLOMBIA — TIENDA CON REGISTRO E INICIO DE SESIÓN

EJECUCIÓN EN WINDOWS
1. Instala Node.js 18 o superior desde https://nodejs.org/ si aún no lo tienes.
2. Extrae toda la carpeta del ZIP.
3. Haz doble clic en iniciar.bat, o abre una terminal en esta carpeta y ejecuta: npm start
4. Abre http://localhost:3000 en Chrome o Edge. No abras index.html directamente: el inicio de sesión necesita el servidor.
5. Pulsa “Ingresa” para iniciar sesión o “Crear cuenta” para registrarte.

CUENTAS
- Registro con nombre, correo y contraseña (mínimo 8 caracteres).
- Inicio de sesión verifica correo y contraseña.
- Las cuentas se guardan en data/users.json en este equipo; las contraseñas se guardan como hash scrypt con salt, no en texto plano.
- La sesión usa cookie HttpOnly y se cierra desde el botón de cuenta.
- El archivo data/users.json se crea automáticamente. Haz una copia de seguridad si necesitas conservar las cuentas.

LIMITACIONES IMPORTANTES
Este sistema funciona como demo local en tu computador; no es todavía un servicio público de producción. No tiene correo de verificación, recuperación de contraseña por email, segundo factor ni despliegue HTTPS. Si vas a publicar la tienda para clientes reales, requiere hosting con HTTPS, protección y copias de seguridad, revisión de seguridad y un flujo de recuperación/verificación. No uses contraseñas que reutilices en otros sitios.
Los pedidos, pagos, inventario y envíos siguen siendo de demostración. No se cobra dinero.
Las fotos remotas requieren internet y pueden ser ilustrativas.

La tienda es un proyecto independiente inspirado en patrones comunes de comercio electrónico, no está afiliada a Mercado Libre.

Actualización de galería y videos (octubre 2026)
- Las fichas incluyen una galería con fotos diferentes seleccionadas según el tipo de producto.
- Las fotos externas son referencias visuales de modelos similares; reemplázalas por fotos del proveedor para asegurar que cada ángulo corresponda al mismo SKU/modelo.
- La sección de videos permite reproducir videos de YouTube incrustados dentro de la página y enlaza a clips de productos de Mercado Libre.
- Los videos son contenido de terceros y requieren conexión a internet; algunos pueden restringir la reproducción incrustada según su propietario.

Actualización de secciones (octubre 2026)
- Secciones nuevas en portada: ofertas del día, compra por categoría, productos por menos de $50.000, productos populares, descubrimiento de tiendas/categorías, beneficios de CompraFácil y accesos de ayuda.
- Rutas nuevas: #/under-50000 y #/popular.
- Estas secciones son demostrativas. No se anuncian tiendas oficiales reales, ni precios, descuentos, popularidad o stock verificados.
