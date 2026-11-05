# App de Flashcards para Repaso de Cálculo y Lógica

Cliente: Academia Horizonte · Desarrolla: Nebula Code Studio
Equipo: Naomi Ramírez, Fabricio Mata, León Rodrigo

## Primer incremento — módulo `gestor_mazos` (RF-01)

Crea mazos con nombre válido y no duplicado.

```
src/
  mazos/gestorMazos.js                 # lógica de creación y validación de mazos
  almacenamiento/almacenamientoMemoria.js  # persistencia aislada (RNF-05)
tests/
  gestorMazos.test.js                  # pruebas normal, límite y error (CA-01)
```

## Ejecutar pruebas

Requiere Node.js 18 o superior. No hay dependencias que instalar.

```
npm test
```
