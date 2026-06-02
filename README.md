# Real Alto WebAR

Prototipo WebAR cliente-side para el Museo Real Alto. Usa A-Frame y MindAR para calibracion con Image Target, un grafo topologico para el recorrido y carga dinamica de modelos glTF segun proximidad.

## Estructura

- `index.html`: escena principal y panel de control.
- `styles.css`: interfaz visual del prototipo.
- `museumMap.js`: grafo de nodos, conexiones y assets.
- `app.js`: componente `gestor-navegacion`, BFS y logica de carga/descarga.

## Archivos que debes agregar

- `assets/targets/realalto-target.mind`: target de MindAR para el Punto 0.
- `assets/models/*.glb`: modelos 3D del museo.

## Como ejecutarlo

El navegador debe abrirse desde `localhost` o HTTPS para permitir camara y tracking AR.

Opciones rapidas:

1. Usar la extension Live Server de VS Code.
2. Levantar un servidor local con cualquier herramienta estandar.

## Notas tecnicas

- La carga de assets se realiza cada 500 ms para reducir consumo en moviles.
- La ruta se calcula con BFS sobre `conexiones`.
- Si no existe un modelo glTF, el sistema cae en una geometria de respaldo para no romper la escena.