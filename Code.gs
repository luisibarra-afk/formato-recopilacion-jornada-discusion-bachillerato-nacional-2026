/**
 * Jornada de Discusión del Bachillerato Nacional (octubre 2026) – CBTIS 179
 * Backend en Google Apps Script vinculado a una Hoja de cálculo.
 *
 * Hojas que crea:
 *  - "Respuestas": una fila por docente (se reemplaza si el mismo docente reenvía).
 *  - "Resumen": concentrado del plantel con el formato de las preguntas 7–13 del
 *    formulario oficial (se genera con el menú "Jornada > Generar resumen").
 */

const HOJA_RESPUESTAS = 'Respuestas';
const HOJA_RESUMEN = 'Resumen';

// Total de docentes del plantel para calcular las proporciones de las preguntas 12 y 13.
// Si se deja en 0 se usa el número de docentes que respondieron.
const TOTAL_DOCENTES = 0;

const P7 = [
  ['p7_1', '7.1 Fortalecimiento del sustento filosófico y pedagógico del MCCEMS'],
  ['p7_2', '7.2 Reducción a una meta educativa por asignatura'],
  ['p7_3', '7.3 Simplificación de los propósitos formativos'],
  ['p7_4', '7.4 Precisión de los principios de la transversalidad para el aprendizaje integral y situado'],
  ['p7_5', '7.5 Desarrollo de los principios de evaluación formativa']
];
const P7_ESCALA = ['Nada pertinente', 'Poco pertinente', 'Muy pertinente'];

const P10 = [
  ['p10_1', '10.1 Modelo Educativo 2025. MCCEMS'],
  ['p10_2', '10.2 Programas de asignatura'],
  ['p10_3', '10.3 Materiales educativos. Comunidad docente'],
  ['p10_4', '10.4 Materiales educativos. Comunidad estudiantil']
];
const P10_ESCALA = ['Nada', 'Poco', 'Mucho'];

const PROPORCIONES = [
  [0.25, 'Menos de un cuarto del personal docente'],
  [0.50, 'Entre un cuarto y la mitad del personal docente'],
  [0.75, 'Entre la mitad y tres cuartos del personal docente'],
  [1.01, 'Más de tres cuartos del personal docente']
];

const COLUMNAS = [
  ['fecha', 'Fecha de envío'],
  ['nombre', 'Nombre(s)'],
  ['apellidoPaterno', 'Apellido paterno'],
  ['apellidoMaterno', 'Apellido materno'],
  ['asignaturas', 'Asignatura(s)'],
  ...P7,
  ['p8_1', '8. Razón 1'],
  ['p8_2', '8. Razón 2'],
  ['p8_3', '8. Razón 3'],
  ['p9', '9. Retos para comprender e implementar los programas'],
  ...P10,
  ['p11_1_1', '11.1 MCCEMS – Uso 1'], ['p11_1_2', '11.1 MCCEMS – Uso 2'], ['p11_1_3', '11.1 MCCEMS – Uso 3'],
  ['p11_2_1', '11.2 Programas – Uso 1'], ['p11_2_2', '11.2 Programas – Uso 2'], ['p11_2_3', '11.2 Programas – Uso 3'],
  ['p11_3_1', '11.3 Mat. docente – Uso 1'], ['p11_3_2', '11.3 Mat. docente – Uso 2'], ['p11_3_3', '11.3 Mat. docente – Uso 3'],
  ['p11_4_1', '11.4 Mat. estudiantil – Uso 1'], ['p11_4_2', '11.4 Mat. estudiantil – Uso 2'], ['p11_4_3', '11.4 Mat. estudiantil – Uso 3'],
  ['p12', '12. Taller "Apropiación del MCCEMS"'],
  ['p13', '13. Curso "Hacia la consolidación del MCCEMS"'],
  ['comentarios', 'Comentarios adicionales']
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Jornada')
    .addItem('Generar resumen', 'generarResumen')
    .addToUi();
}

function doGet() {
  return json_({ ok: true, servicio: 'Jornada de Discusión 2026' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const data = JSON.parse(e.postData.contents);
    ['nombre', 'apellidoPaterno', 'apellidoMaterno'].forEach(k => {
      if (!data[k] || !String(data[k]).trim()) throw new Error('Falta el campo ' + k);
    });
    data.fecha = new Date();

    const sh = hojaRespuestas_();
    const fila = COLUMNAS.map(([k]) => data[k] !== undefined ? data[k] : '');
    const existente = buscarDocente_(sh, data);
    if (existente) {
      sh.getRange(existente, 1, 1, fila.length).setValues([fila]);
    } else {
      sh.appendRow(fila);
    }
    return json_({ ok: true, actualizado: Boolean(existente) });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function hojaRespuestas_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA_RESPUESTAS);
  if (!sh) sh = ss.insertSheet(HOJA_RESPUESTAS);
  // Encabezados siempre alineados con COLUMNAS (por si cambió la versión del formulario)
  sh.getRange(1, 1, 1, COLUMNAS.length)
    .setValues([COLUMNAS.map(([, titulo]) => titulo)])
    .setFontWeight('bold').setBackground('#691c32').setFontColor('#ffffff').setWrap(true);
  const sobrantes = sh.getLastColumn() - COLUMNAS.length;
  if (sobrantes > 0) sh.getRange(1, COLUMNAS.length + 1, 1, sobrantes).clearContent().setBackground(null);
  sh.setFrozenRows(1);
  return sh;
}

// Devuelve el número de fila del docente si ya envió antes (mismo nombre completo), o 0.
function buscarDocente_(sh, data) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const clave = [data.nombre, data.apellidoPaterno, data.apellidoMaterno].map(normaliza_).join('|');
  const valores = sh.getRange(2, 2, n, 3).getValues();
  for (let i = 0; i < valores.length; i++) {
    if (valores[i].map(normaliza_).join('|') === clave) return i + 2;
  }
  return 0;
}

function normaliza_(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Concentra las respuestas del plantel con la estructura de las preguntas 7–13
 * del formulario oficial, para que la persona relatora lo transcriba.
 */
function generarResumen() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = hojaRespuestas_();
  const n = sh.getLastRow() - 1;
  if (n < 1) {
    SpreadsheetApp.getUi().alert('No hay respuestas registradas.');
    return;
  }
  const valores = sh.getRange(2, 1, n, COLUMNAS.length).getValues();
  const registros = valores.map(fila => {
    const r = {};
    COLUMNAS.forEach(([k], i) => { r[k] = fila[i]; });
    return r;
  });

  let res = ss.getSheetByName(HOJA_RESUMEN);
  if (res) res.clear(); else res = ss.insertSheet(HOJA_RESUMEN);

  const salida = [];
  const titulos = [];
  const push = (fila, titulo) => {
    salida.push(fila.concat(Array(5 - fila.length).fill('')));
    if (titulo) titulos.push(salida.length);
  };

  {
    const grupo = registros;
    push(['PLANTEL – docentes que respondieron: ' + grupo.length], true);

    push(['7. Pertinencia de los cambios', ...P7_ESCALA, 'Respuesta predominante'], true);
    P7.forEach(([k, etiqueta]) => push([etiqueta, ...conteoEscala_(grupo, k, P7_ESCALA)]));

    push(['8. Razones de pertinencia / no pertinencia'], true);
    lista_(grupo, ['p8_1', 'p8_2', 'p8_3']).forEach(t => push(['• ' + t]));

    push(['9. Retos para comprender e implementar los programas'], true);
    lista_(grupo, ['p9']).forEach(t => push(['• ' + t]));

    push(['10. Conocimiento de recursos y materiales', ...P10_ESCALA, 'Respuesta predominante'], true);
    P10.forEach(([k, etiqueta]) => push([etiqueta, ...conteoEscala_(grupo, k, P10_ESCALA)]));

    push(['11. Usos de los materiales'], true);
    P10.forEach(([, etiqueta], i) => {
      const m = i + 1;
      push(['11.' + m + ' ' + etiqueta.replace(/^10\.\d\s/, '')]);
      lista_(grupo, ['p11_' + m + '_1', 'p11_' + m + '_2', 'p11_' + m + '_3']).forEach(t => push(['   • ' + t]));
    });

    const total = TOTAL_DOCENTES || grupo.length;
    [['p12', '12. Taller "Apropiación del MCCEMS"'], ['p13', '13. Curso "Hacia la consolidación del MCCEMS"']].forEach(([k, etiqueta]) => {
      const concluyeron = grupo.filter(r => r[k] === 'Sí, lo concluí').length;
      const prop = concluyeron / total;
      push([etiqueta, 'Concluyeron: ' + concluyeron + ' de ' + total, Math.round(prop * 100) + '%', categoria_(prop)], true);
    });
  }

  res.getRange(1, 1, salida.length, 5).setValues(salida).setWrap(true).setVerticalAlignment('top');
  titulos.forEach(f => res.getRange(f, 1, 1, 5).setFontWeight('bold').setBackground('#f1e6e9'));
  res.setColumnWidth(1, 420);
  res.setColumnWidths(2, 4, 150);
  ss.setActiveSheet(res);
}

// Conteo por opción de la escala + opción predominante (empates se reportan juntos).
function conteoEscala_(grupo, clave, escala) {
  const conteos = escala.map(op => grupo.filter(r => r[clave] === op).length);
  const max = Math.max.apply(null, conteos);
  const predominante = max ? escala.filter((_, i) => conteos[i] === max).join(' / ') : '';
  return conteos.concat(predominante);
}

function lista_(grupo, claves) {
  const out = [];
  grupo.forEach(r => claves.forEach(k => {
    const t = String(r[k] || '').trim();
    if (t) out.push(t);
  }));
  return out;
}

function categoria_(prop) {
  for (let i = 0; i < PROPORCIONES.length; i++) {
    if (prop < PROPORCIONES[i][0]) return PROPORCIONES[i][1];
  }
  return PROPORCIONES[PROPORCIONES.length - 1][1];
}
