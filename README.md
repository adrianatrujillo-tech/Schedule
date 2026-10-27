# Schedule ♡

Agenda con diseño pastel para organizar tareas, notas, estudio y recordatorios. Esta es una **demostración frontend pública**, independiente de cualquier cuenta o infraestructura personal.

## Funciones

- Tareas: crear, editar, completar y eliminar con una papelera visible.
- Calendario con los pendientes de cada día.
- Notas: borrador automático, historial de notas guardadas, búsqueda, lectura, edición y eliminación individual.
- Recordatorios: fecha/hora, repetición diaria opcional, tarea relacionada, posponer 5 minutos y completar.
- Sonidos WAV incluidos: campanitas, melodía suave y alarma digital; volumen ajustable y prueba de audio.
- Pomodoro para estudiar con descansos.
- Marca Schedule con el corazón proporcionado e interfaz adaptable al celular.
- Herramientas de exportación al final, dentro de Ajustes y conexión.

## Ejecutar

Abre esta carpeta en VS Code y utiliza Live Server, o ejecuta desde la carpeta donde está index.html:

```powershell
py -m http.server 8000
```

En otros sistemas puedes usar `python -m http.server 8000`. Después abre `http://localhost:8000`. No necesitas npm, cuenta ni contraseña. El servidor entrega archivos estáticos; no es un backend de datos.

## Datos y privacidad

Todo lo que se crea en esta demostración se guarda en el navegador del visitante mediante localStorage. No hay Supabase, SDK de autenticación, cuenta personal, base de datos remota, telemetría ni conexión al despliegue de la aplicación personal.

Los archivos de sonido, las fuentes y el corazón están incluidos en el proyecto. No se utilizan CDNs. Las notas nuevas y los recordatorios no se sincronizan entre dispositivos. El botón Copia de seguridad descarga un JSON local sin credenciales; no incluye restauración automática.

## Notas

Mientras escribes se conserva un borrador. Pulsa **Guardar nota** para crear una entrada en **Notas guardadas**. Despliega el título para leer el texto. Puedes editar o borrar cada entrada. Borrar datos del sitio elimina las notas y recordatorios locales.

## Alarmas: qué puede hacer esta versión

Pulsa **Activar sonidos** tras abrir o recargar la app y utiliza **Probar**. La alarma visual y el sonido se activan cuando la aplicación está abierta y el navegador permite ejecutarla. El sonido se detiene automáticamente tras 60 segundos o mediante sus controles.

No se garantiza una alarma exacta con la app cerrada, suspendida o con el teléfono bloqueado. No se implementó Web Push ni una alarma nativa de Android. Un recordatorio vencido se presenta al volver a abrir la página. Las notificaciones son opcionales y dependen del permiso y soporte del navegador. Para recordatorios críticos utiliza también la alarma del teléfono.

## Tecnologías

HTML, CSS generado con Tailwind CSS, JavaScript, localStorage, Web Audio API y Notification API opcional. Esta copia pública no registra un service worker ni incluye instalación PWA; la versión personal mantiene esa infraestructura por separado.

## Archivos principales

| Archivo | Función |
| --- | --- |
| `index.html` | Pantallas de la agenda y formulario de recordatorios. |
| `static/base.js` | Listas, calendario y navegación. |
| `static/app.js` | Interacción de tareas y pomodoro de demostración. |
| `static/demo-store.js` | Persistencia local de tareas y pomodoro. |
| `static/schedule.js` | Notas guardadas, recordatorios, audio y disposición del pie. |
| `static/schedule-core.js` | Validación y cálculo de fechas. |
| `static/schedule.css` | Estilos de Schedule. |
| `static/sounds/` | Tres sonidos WAV originales generados para este proyecto. |
| `icons/heart.png` | Imagen de corazón proporcionada como marca. |
| `tests/` | Pruebas de las operaciones locales y las reglas de recordatorios. |

## Pruebas

Con Node.js 18 o superior:

```bash
node tests/demo-store.test.cjs
node tests/schedule-core.test.cjs
```

Se comprobaron también en el navegador las tareas, el guardado de borradores y notas, su lectura y eliminación tras recargar, la creación de recordatorios y la carga de los sonidos. El comportamiento del teléfono real con pantalla bloqueada depende del sistema.

## Subir a GitHub

Utiliza únicamente ESTA carpeta pública, sin mezclarla con el proyecto personal ni sus ZIPs de despliegue. Se entrega sin historial anterior ni archivos de configuración de cuentas.

```bash
git init
git add .
git status --short
git diff --cached --name-only
git commit -m "Agrega Schedule: agenda con recordatorios y notas locales"
git branch -M main
```

Después conecta el repositorio vacío que hayas creado y sube `main`. Puedes mostrar esta demostración con GitHub Pages desde la raíz de la rama; las rutas son relativas.

`.gitignore` excluye configuración privada, certificados, bases locales y exportaciones. No puede eliminar secretos que alguien haya registrado antes en otro historial.

## Créditos

Desarrollado con asistencia de IA para prototipado e implementación. Fredoka y Quicksand se distribuyen bajo SIL Open Font License; licencias incluidas en static/. El corazón se conserva tal como fue proporcionado. Antes de redistribuirlo públicamente, verifica el permiso o licencia de esa imagen.
