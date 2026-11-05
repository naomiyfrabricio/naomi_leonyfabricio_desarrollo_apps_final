# App de Flashcards para Repaso de Cálculo y Lógica

Cliente: Academia Horizonte · Desarrolla: Nebula Code Studio
Equipo: Naomi Ramírez, Fabricio Mata, León Rodrigo

## Estado

| Incremento | Tag | Entrega |
| --- | --- | --- |
| 1 | v0.1.0 | Crear mazos (RF-01) |
| 2 | v0.2.0 | Añadir tarjetas (RF-04), modo estudio (RF-07) y aviso de mazo vacío (RF-11), con interfaz web y guardado local |

## Estructura

```
index.html                               # interfaz web
src/mazos/gestorMazos.js                 # crear y listar mazos (RF-01)
src/tarjetas/gestorTarjetas.js           # añadir tarjetas (RF-04)
src/estudio/sesionEstudio.js             # modo estudio y mazo vacío (RF-07, RF-11)
src/almacenamiento/                      # memoria y localStorage, misma interfaz (RNF-05, RNF-09)
src/ui/controlador.js, src/ui/app.js     # integración y DOM
tests/                                   # pruebas unitarias y de integración
docs/                                    # especificación y plan de incrementos
```

## Usar la app

Los módulos ES requieren abrir la página desde un servidor local:

```
python -m http.server 8000
```

y abrir http://localhost:8000 en Chrome, Firefox o Edge.

## Pruebas

Requiere Node.js 18 o superior, sin dependencias.

```
npm test
```
