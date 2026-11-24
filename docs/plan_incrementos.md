# Plan de incrementos — App de Flashcards para Repaso de Cálculo y Lógica

**Cliente:** Academia Horizonte  
**Equipo desarrollador:** Nebula Code Studio (Naomi y Fabricio, según especificación v2.0)  
**Versión del plan:** borrador para publicación con distribución de RF aprobada por el equipo  
**Fuentes:** `Requerimientos_Flashcards_v2.pdf`, secciones 1–12; guía `plan_incremental.pdf`, fase A.  
**Estado de ejecución al 19 nov 2026:**

| Indicador | Valor | Detalle |
|---|---|---|
| Avance programado | **100 %** | Los 4 incrementos planeados están cubiertos. |
| Avance real implementado | **100 %** | Los 4 incrementos están implementados, probados y publicados con tag en GitHub. |
| Incremento 4 | **Cerrado (v0.4.0)** | RF-10 y RF-12 implementados; formato de intercambio decidido: JSON (ver §7). |

Tags en `main`: v0.1.0, v0.2.0, v0.3.0 y v0.4.0; 61 de 61 pruebas pasan.

## 1. Criterios y alcance

- El reparto funcional de los incrementos 1–4 fue aprobado por el equipo y se reproduce **sin modificaciones**.
- Un RF aparece en **un solo incremento**; las historias de usuario y criterios de aceptación se vinculan por la matriz de trazabilidad de la especificación (§12).
- Cada incremento debe concluir con funcionalidad utilizable y verificable, pruebas normales/de límite/de error, commits por tarea y un tag en GitHub. El cierre real solo puede declararse con evidencia.
- No se incluyen sincronización en la nube, cuentas, repetición espaciada avanzada, multimedia, colaboración en tiempo real ni interfaz multiidioma (especificación, §4).
- Existen funciones extra de interfaz fuera de los RF-01 a RF-12. No cuentan para la evaluación y no modifican los RF ni sus pruebas. La lista está en el README, sección «Funciones extra (fuera del alcance evaluado)».
- Extra del 2026-11-22 (marcado como extra, fuera de RF-01 a RF-12): botón «▶ Estudiar» por mazo en la lista, carga de mazos de ejemplo (`src/extra/mazosEjemplo.js`), foco en Pregunta tras añadir tarjeta y desplazamiento suave a las secciones abiertas. Solo tocan la interfaz (`src/ui/app.js`, `index.html`).
- Extra del 2026-11-23 (marcado como extra, fuera de RF-01 a RF-12): agrupación de «Tus mazos» por categoría, plegable y recordada en `localStorage` (`src/extra/categorias.js`, clave `flashcards.ui.gruposPlegados`). Solo toca la interfaz (`src/ui/app.js`, `index.html`); no cambia `src/mazos`, `src/tarjetas`, `src/estudio`, `src/estadisticas`, `src/intercambio` ni `src/almacenamiento`.

## 2. Inventario de requerimientos funcionales

La especificación (§5) no asigna prioridades explícitas a los RF: se registra **«No indicada»**. La columna «Dependencia» identifica solo prerequisitos funcionales deducibles de las funciones descritas; no equivale a prioridad formal. La última columna indica el estado verificado con pruebas y tag en GitHub.

| ID | Descripción breve | Tipo | Prioridad | Dependencia funcional | Fuente | Incremento | Estado verificable |
|---|---|---|---|---|---|---|---|
| RF-01 | Crear mazo; rechazar nombre vacío o duplicado. | RF | No indicada | Ninguna indicada | §5, CA-01 §8 | 1 | Implementado (v0.1.0) |
| RF-02 | Editar nombre de mazo sin duplicados ni vacío. | RF | No indicada | RF-01 (mazo existente) | §5, CA-06 §8 | 3 | Implementado (v0.3.0) |
| RF-03 | Eliminar mazo y tarjetas con confirmación. | RF | No indicada | RF-01 (mazo existente) | §5, CA-06 §8 | 3 | Implementado (v0.3.0) |
| RF-04 | Añadir tarjeta con pregunta y respuesta no vacías. | RF | No indicada | RF-01 (mazo existente) | §5, CA-02 §8 | 2 | Implementado (v0.2.0) |
| RF-05 | Editar pregunta o respuesta de tarjeta existente. | RF | No indicada | RF-04 (tarjeta existente) | §5, CA-06 §8 | 3 | Implementado (v0.3.0) |
| RF-06 | Eliminar tarjeta con confirmación. | RF | No indicada | RF-04 (tarjeta existente) | §5, CA-06 §8 | 3 | Implementado (v0.3.0) |
| RF-07 | Estudiar tarjetas de una en una y revelar respuesta. | RF | No indicada | RF-04 (mazo con tarjetas) | §5, CA-03 §8 | 2 | Implementado (v0.2.0) |
| RF-08 | Registrar acierto o fallo por tarjeta estudiada. | RF | No indicada | RF-07 (modo estudio) | §5, CA-04 §8 | 3 | Implementado (v0.3.0) |
| RF-09 | Calcular porcentaje acumulado de aciertos por mazo. | RF | No indicada | RF-08 (registros de estudio) | §5, CA-04 §8 | 3 | Implementado (v0.3.0) |
| RF-10 | Exportar e importar mazos mediante archivo local. | RF | No indicada | RF-01, RF-04 (mazos y tarjetas) | §5, CA-05 §8 | 4 | Implementado (v0.4.0) |
| RF-11 | Impedir estudiar mazo vacío y mostrar aviso. | RF | No indicada | RF-01, RF-07 (mazo y acceso a estudio) | §5, CA-07 §8 | 2 | Implementado (v0.2.0) |
| RF-12 | Rechazar importaciones corruptas sin cambiar los mazos. | RF | No indicada | RF-10 (importación) | §5, CA-05 §8 | 4 | Implementado (v0.4.0) |

**Cobertura:** 12/12 RF asignados exactamente una vez; 10/12 implementados al 10 nov 2026.  
**Reparto aprobado:** Inc 1 = RF-01; Inc 2 = RF-04, RF-07, RF-11; Inc 3 = RF-02, RF-03, RF-05, RF-06, RF-08, RF-09; Inc 4 = RF-10, RF-12.

### 2.1 Inventario de RNF transversales

Los RNF se aplican a los incrementos pertinentes y **no constituyen RF adicionales**; su verificación es acumulativa.

| ID | Exigencia según especificación (§6) | Validación prevista |
|---|---|---|
| RNF-01 | Interfaz responsiva desde 320 px. | Comprobar en las pantallas entregadas de cada incremento. |
| RNF-02 | Revelar respuesta en menos de 500 ms. | Medir en el incremento 2 y en regresión. |
| RNF-03 | Validar estructura antes de cargar importación. | Comprobar en incremento 4 junto a RF-12. |
| RNF-04 | Módulos separados de mazos, tarjetas y estadísticas. | Revisar progresivamente la arquitectura. |
| RNF-05 | Persistencia aislada detrás de interfaz común. | Revisar implementación en incrementos que guardan datos. |
| RNF-06 | Chrome, Firefox y Edge actuales, o plataformas nativas especificadas. | Probar en la plataforma elegida, aún no documentada. |
| RNF-07 | Pruebas unitarias para alta, edición y eliminación de mazos y tarjetas; éxito y error. | Incorporar a incrementos 1, 2 y 3 según las funciones entregadas. |
| RNF-08 | Manual breve y comentarios en funciones públicas. | Actualizar documentación hasta el cierre del proyecto. |
| RNF-09 | Datos de mazos y tarjetas locales; uso normal sin internet. | Verificar persistencia y funcionamiento sin red. |

### 2.2 Historias de usuario y criterios de aceptación

| HU | RF relacionados (§7, §12) | CA (§8) | Incremento asociado | Estado verificable |
|---|---|---|---|---|
| HU-01 | RF-01 | CA-01 | 1 | Implementado (v0.1.0) |
| HU-02 | RF-04 | CA-02 | 2 | Implementado (v0.2.0) |
| HU-03 | RF-07 | CA-03 | 2 | Implementado (v0.2.0) |
| HU-04 | RF-08, RF-09 | CA-04 | 3 | Implementado (v0.3.0) |
| HU-05 | RF-10 y, por matriz de trazabilidad, RF-12 | CA-05 | 4 | Implementado (v0.4.0) |
| HU-06 | RF-02, RF-03, RF-05, RF-06 | CA-06 | 3 | Implementado (v0.3.0) |
| HU-07 | RF-11 | CA-07 | 2 | Implementado (v0.2.0) |

## 3. Incremento 1 — v0.1.0

| Campo | Ficha |
|---|---|
| Objetivo | Permitir crear y consultar un mazo válido en la lista principal, con manejo de nombres vacíos o duplicados. |
| RF | RF-01 (§5). |
| HU | HU-01 (§7). |
| Criterios de aceptación | **CA-01 (§8):** guardar y mostrar mazo de nombre válido; rechazar nombre vacío; rechazar nombre duplicado con mensaje. |
| Módulos involucrados | Gestión de mazos y persistencia local (RNF-04, RNF-05, RNF-09, §6); nombres concretos de archivos no establecidos. |
| Depende de | Ningún incremento anterior. |
| Pruebas mínimas | Normal: crear y mostrar mazo único. Límite: nombre vacío. Error: nombre duplicado. Verificar persistencia local. |
| Rama Git | `main` como línea base al cierre del incremento 1 (según guía). |
| Tag esperado | `v0.1.0`. |
| Fecha de cierre | Planeada: Semana 12 (2–8 nov), cierre 5 nov 13:00. **Real:** 5 nov, commit 8cd8ffe. |
| Decisión del equipo | **Terminado** · tag v0.1.0 · 9 pruebas. |

**Justificación del agrupamiento:** establecer mazos es requisito práctico para agregar tarjetas en el incremento 2 y editar/eliminar mazos en el 3 (§§5, 7 y 8).

## 4. Incremento 2 — v0.2.0

| Campo | Ficha |
|---|---|
| Objetivo | Permitir añadir tarjetas y repasarlas una a una, con aviso al intentar estudiar un mazo vacío. |
| RF | RF-04, RF-07, RF-11 (§5). |
| HU | HU-02, HU-03, HU-07 (§7). |
| Criterios de aceptación | **CA-02 (§8):** añadir tarjeta válida, aumentar contador, rechazar pregunta/respuesta vacía. **CA-03 (§§8 y 6):** mostrar pregunta con respuesta oculta y revelarla en menos de 500 ms. **CA-07 (§8):** advertir mazo vacío y no iniciar estudio. |
| Módulos involucrados | Gestión de tarjetas, modo estudio, gestión de mazos y persistencia local (organización modular RNF-04 y RNF-05, §6). |
| Depende de | Inc. 1 (RF-01); RF-07 necesita tarjetas de RF-04; RF-11 controla el inicio del estudio. |
| Pruebas mínimas | Normal: añadir tarjeta válida, iniciar estudio y revelar respuesta. Límite: mazo vacío y campos de tarjeta vacíos. Error: impedir guardar tarjeta inválida. Medir revelado <500 ms. |
| Rama Git | `incremento-2`. |
| Tag esperado | `v0.2.0`. |
| Fecha de cierre | Planeada: Semana 13 (9–15 nov), cierre 15 nov. **Real:** 5 nov, merge d40f6ab (10 días antes). |
| Decisión del equipo | **Terminado** · tag v0.2.0 · 31 pruebas acumuladas. |

**Justificación del agrupamiento:** las tres funciones forman un flujo de estudio utilizable de extremo a extremo; el manejo de mazos vacíos evita un flujo inválido (CA-02, CA-03 y CA-07, §8).

## 5. Incremento 3 — v0.3.0

| Campo | Ficha |
|---|---|
| Objetivo | Habilitar mantenimiento de mazos/tarjetas y registro de desempeño durante el estudio con porcentaje por mazo. |
| RF | RF-02, RF-03, RF-05, RF-06, RF-08, RF-09 (§5). |
| HU | HU-06, HU-04 (§7). |
| Criterios de aceptación | **CA-06 (§8):** editar contenido válido con reflejo inmediato y confirmar antes de eliminar. **CA-04 (§8):** guardar acierto/fallo y reflejarlo en porcentaje; mostrar 0 % cuando no existen registros previos. RF-02 también exige nombres de mazos no vacíos ni duplicados (§5). |
| Módulos involucrados | Gestión de mazos, tarjetas, estadísticas y persistencia local (RNF-04 y RNF-05, §6). |
| Depende de | Inc. 1 (mazos) e Inc. 2 (tarjetas y modo estudio). Dentro del incremento, RF-09 depende de RF-08. |
| Pruebas mínimas | Normal: editar mazo/tarjeta, eliminar con confirmación, registrar acierto y fallo y comprobar porcentaje. Límite: mazo sin registros = 0 %. Error: edición de nombre inválido/duplicado y cancelación de borrado. Ejecutar regresión de Inc. 1 y 2. |
| Rama Git | `incremento-3`. |
| Tag esperado | `v0.3.0`. |
| Fecha de cierre | Planeada: Semana 14 (16–22 nov), cierre 22 nov. **Real:** 10 nov, merge c155c36 (12 días antes). |
| Decisión del equipo | **Terminado** · tag v0.3.0 · 53 pruebas acumuladas. |

**Justificación del agrupamiento:** la edición y eliminación dependen de entidades ya creadas; la estadística requiere primero un modo estudio y el registro de aciertos/fallos (RF-07 a RF-09, §5).

## 6. Incremento 4 — v0.4.0

| Campo | Ficha |
|---|---|
| Objetivo | Permitir compartir mazos por archivos locales, rechazando archivos malformados sin alterar los datos existentes. |
| RF | RF-10, RF-12 (§5). |
| HU | HU-05 (§7; RF-12 está asociado a HU-05 en matriz de trazabilidad §12). |
| Criterios de aceptación | **CA-05 (§8):** exportar nombre y tarjetas; importar archivo válido conservando su contenido; ante archivo corrupto, mostrar error y no modificar mazos existentes. |
| Módulos involucrados | `src/intercambio/intercambioMazos.js`: exportar/importar sobre la misma interfaz de persistencia (RNF-04, RNF-05, RNF-09, §6); valida la estructura del archivo antes de tocar el almacenamiento (RNF-03). |
| Depende de | Inc. 1 y 2 para tener mazos y tarjetas. Formato de archivo definido: JSON con `{ nombre, tarjetas: [{ pregunta, respuesta }] }` (ver §7). |
| Pruebas mínimas | Normal: exportar e importar en otro entorno y comparar nombre y tarjetas. Límite: mazo sin tarjetas. Error: JSON corrupto, nombre vacío/duplicado, tarjeta con campo vacío y archivo que no es un objeto; se verifica que los mazos previos no cambian. Regresión de Inc. 1–3. |
| Rama Git | `incremento-4`. |
| Tag | `v0.4.0`. |
| Fecha de cierre | 19 nov 2026. |
| Decisión del equipo | **Reparto aprobado**; formato de intercambio: JSON (decisión registrada en §7). Implementado y probado (61/61 pruebas). |

**Justificación del agrupamiento:** RF-12 protege la importación definida en RF-10 y ambos se verifican con CA-05 (§§5, 8 y 12).

## 7. Ambigüedades: decisiones acreditadas y asuntos abiertos

> **Importante:** la única decisión adicional confirmada por el equipo en esta solicitud es el **reparto de los RF por incremento**. La especificación (§9) enumera cuestiones no resueltas; no deben declararse «resueltas» sin constancia del equipo o profesor.

| Tema | Estado | Resolución acreditada o siguiente decisión requerida | Fuente |
|---|---|---|---|
| Distribución de los 12 RF | **Resuelto por el equipo** | Inc. 1: RF-01; Inc. 2: RF-04, RF-07, RF-11; Inc. 3: RF-02, RF-03, RF-05, RF-06, RF-08, RF-09; Inc. 4: RF-10, RF-12. | Reparto aprobado comunicado por el equipo. |
| Formato de importación/exportación | **Resuelto: JSON** | Se eligió JSON sobre el almacenamiento (`{ nombre, tarjetas: [{ pregunta, respuesta }] }`) porque es el mismo formato que ya usa `AlmacenamientoLocal` para persistir mazos, sin introducir un parser nuevo. La validación de estructura (RF-12, RNF-03) rechaza JSON malformado, mazos sin nombre válido o sin la forma esperada antes de modificar el almacenamiento. | Decisión de implementación del incremento 4. |
| Máximo de tarjetas y de mazos | **Pendiente** | Determinar si existen límites y cómo afectan al rendimiento. | §9 |
| Símbolos lógicos especiales | **Pendiente** | Decidir si se requiere soporte de entrada especial; no agregar funciones fuera de alcance sin aprobación. | §9 |
| Pérdida de información local | **Riesgo identificado; decisión pendiente** | Definir si se mostrará advertencia de pérdida de información; la especificación la recomienda. | §9 |
| Tecnología de desarrollo | **Pendiente** | Confirmar web responsiva, Android nativo o multiplataforma para concretar RNF-06. | §9 |
| Longitud máxima de pregunta/respuesta | **Pendiente** | Definir si existen límites de caracteres antes de establecer casos límite adicionales. | §9 |
| Tiempo disponible y fecha de cierre | **Resuelto por el equipo** | Un incremento por semana del curso: cierres 5, 15, 22 y 29 nov 2026 (semanas 12 a 15). | §3 y guía A3 |
| Estado real de Inc. 1 a 3 | **Verificado** | Tags v0.1.0, v0.2.0 y v0.3.0 en `main`; 53 de 53 pruebas pasan; ver reporte de avance del 10 nov 2026. | Fases B y C |

## 8. Comprobación cruzada del plan (A4)

- [x] Cada RF-01 a RF-12 se asignó a **exactamente un** incremento.
- [x] El reparto de RF coincide exactamente con el comunicado por el equipo.
- [x] La propuesta usa funciones descritas en la especificación (§5) y criterios de aceptación (§8); no añade funcionalidades de producto fuera de alcance.
- [x] El orden respeta dependencias principales: RF-01 → RF-04 → RF-07 → RF-08 → RF-09 y RF-10 → RF-12.
- [x] Cada objetivo describe una función ejecutable y verificable; que efectivamente sea ejecutable al cerrar cada versión requiere pruebas reales.
- [x] Carga viable: calendario fijado por el equipo (semanas 12 a 15).
- [ ] Resolver decisiones abiertas de §9 antes de que afecten la implementación.
- [ ] Verificar resultados, revisión del equipo y aprobación final.

## 9. Definición de terminado por incremento

No marcar como cumplido hasta contar con evidencia:

- [ ] Todos los RF del incremento cumplen sus CA correspondientes.
- [ ] Cada tarea dispone de commit y push verificables en GitHub.
- [ ] Pasan las pruebas de éxito, límite y error con resultados registrados.
- [ ] Pasan las pruebas de regresión de incrementos anteriores.
- [ ] No quedan observaciones críticas pendientes del contraste con ChatGPT.
- [ ] El cambio se integra a `main` y se publica su tag correspondiente.
- [ ] README, matriz de trazabilidad, bitácora de IA y este plan están actualizados.

## 10. Registro de cambios al plan

| Fecha | Cambio | Motivo | Aprobación |
|---|---|---|---|
| 2026-11-05 | Se documenta la distribución de RF-01 a RF-12 en cuatro incrementos. | Reparto explícito comunicado por el equipo. | Equipo |
| 2026-11-10 | Se fija el calendario: un incremento por semana del curso (semanas 12 a 15, cierres 5, 15, 22 y 29 nov). | El plan no tenía fechas de cierre; se necesitan para comparar lo planeado con lo real. | Equipo |
| 2026-11-10 | Se registran los cierres reales de los incrementos 1 a 3 y el estado de cada RF. | Reporte de avance de la sesión 1 de implementación. | Equipo |
| 2026-11-10 | Se distingue el avance programado (50 % al cierre de la semana 13) del real (75 %). El incremento 3 queda registrado como terminado anticipadamente; el 4 se mantiene en la semana 15. | Reportar el cumplimiento del calendario académico sin ocultar el trabajo adelantado. | Equipo |
| 2026-11-20 | Se documentan las funciones extra de interfaz (fuera de RF-01 a RF-12) y la opción de ver la explicación del tema antes de estudiar. | El proyecto ya implementa los 4 incrementos y se añadieron mejoras de interfaz solicitadas por la autora | Naomi (solicitud propia) |
| 2026-11-22 | Extra (fuera de RF-01 a RF-12): botón «▶ Estudiar» en cada mazo de la lista, carga de mazos de ejemplo, foco en Pregunta tras añadir tarjeta y desplazamiento suave a las secciones que se abren. | Reducir los pasos para usar la app; no cambia la lógica de mazos, tarjetas, estudio, estadísticas, intercambio ni almacenamiento. | Naomi (solicitud propia) |
| 2026-11-23 | Extra (fuera de RF-01 a RF-12): «Tus mazos» se agrupa por categoría, con grupos plegables que se recuerdan en `localStorage` (clave `flashcards.ui.gruposPlegados`). | Ordenar una lista plana de 18 mazos de ejemplo; solo cambia la interfaz, no los datos guardados ni la lógica de mazos, tarjetas, estudio, estadísticas, intercambio ni almacenamiento. | Naomi (solicitud propia) |

## 11. Referencias de la especificación

- **§3:** Alcance del proyecto.
- **§4:** Fuera del alcance.
- **§5:** RF-01 a RF-12.
- **§6:** RNF-01 a RNF-09.
- **§7:** HU-01 a HU-07.
- **§8:** CA-01 a CA-07.
- **§9:** Riesgos y ambigüedades.
- **§12:** Matriz de trazabilidad.

**Nota de publicación:** guardar este archivo como `docs/plan_incrementos.md` en el repositorio. No se han ejecutado comandos Git ni publicado commits o tags durante la elaboración de este documento.
