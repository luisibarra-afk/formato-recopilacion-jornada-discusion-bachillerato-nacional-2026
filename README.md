# Formato de recopilación – Jornada de Discusión del Bachillerato Nacional (octubre 2026)

Formulario individual para docentes (`index.html`) conectado a Google Apps Script (`Code.gs`). Homologa las preguntas 7–13 del formulario oficial con las preguntas orientadoras del Anexo 1; el script concentra las respuestas del plantel para que la persona relatora llene el reporte oficial.

## Correspondencia de preguntas

El formulario docente numera del 1 al 7; la hoja "Resumen" conserva la numeración del formato oficial (7 a 13) para transcribirla directamente.

| Formulario oficial | Formulario docente | Concentrado (hoja "Resumen") |
|---|---|---|
| 7. Pertinencia 7.1–7.5 | 1. Misma escala por docente | Conteo por opción y respuesta predominante |
| 8. Tres razones | 2. Hasta 3 razones (mínimo 1) | Lista de todas las razones |
| 9. Retos | 3. Texto libre | Lista de retos |
| 10. Conocimiento 10.1–10.4 | 4. Misma escala por docente | Conteo y respuesta predominante |
| 11. Tres usos por material | 5. Hasta 3 usos por material (mínimo 1 uso en total) | Lista por material |
| 12. Proporción que cursó el taller | 6. ¿Cursó el taller? (Sí / Iniciado / No) | % que concluyó y rango (cuartos) |
| 13. Proporción que realizó el curso | 7. ¿Realizó el curso? (Sí / Iniciado / No) | % que concluyó y rango (cuartos) |

Las preguntas 1–6 (caracterización del plantel) no se piden al docente; las llena la persona relatora.

## Instalación

1. Crear una Hoja de cálculo de Google.
2. Extensiones → Apps Script. Pegar el contenido de `Code.gs` y guardar.
3. Opcional: en `TOTAL_DOCENTES` poner el total de docentes del plantel. Con 0 se usa el número de docentes que respondieron como base de las preguntas 12 y 13.
4. Implementar → Nueva implementación → Tipo: Aplicación web.
   - Ejecutar como: Yo.
   - Quién tiene acceso: Cualquier persona.
5. Copiar la URL `.../exec` y pegarla en `SCRIPT_URL` dentro de `index.html`.
6. Publicar `index.html` (GitHub Pages, Drive o servidor del plantel) y enviar el enlace a los docentes.

## Uso

- Cada envío agrega una fila en la hoja "Respuestas". Si un docente reenvía con el mismo nombre completo, su fila se reemplaza.
- En la hoja de cálculo: menú **Jornada → Generar resumen** crea la hoja "Resumen" con el concentrado de todo el plantel.
- Los rangos de proporción (preguntas 12 y 13) usan: menos de un cuarto, entre un cuarto y la mitad, entre la mitad y tres cuartos, más de tres cuartos. Ajustar el texto en `PROPORCIONES` si el formulario oficial usa otras etiquetas.
