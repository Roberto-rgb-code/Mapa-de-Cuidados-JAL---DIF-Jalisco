# Mapa de Cuidados JAL - ArcGIS

Aplicación web moderna para visualizar y filtrar el mapa de cuidados de Jalisco usando ArcGIS JavaScript SDK.

## Características

- 🗺️ Visualización interactiva del mapa de ArcGIS
- 🔍 Filtros por:
  - Nombre de clase de la actividad
  - Municipio
- 📱 Diseño responsive y moderno
- ⚡ Carga rápida y optimizada

## Instalación

No requiere instalación de dependencias. La aplicación utiliza el SDK de ArcGIS desde CDN.

## Uso

1. Abre `index.html` en tu navegador web moderno
2. El mapa se cargará automáticamente
3. Usa los filtros en la barra lateral para filtrar los datos del mapa
4. Haz clic en "Aplicar filtros" para actualizar la vista
5. Usa "Limpiar filtros" para resetear la visualización

## Estructura

```
.
├── index.html      # Página principal
├── styles.css      # Estilos de la aplicación
├── app.js          # Lógica de ArcGIS y filtros
└── README.md       # Este archivo
```

## Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para cargar el SDK de ArcGIS)

## Notas

La aplicación detecta automáticamente los campos de "actividad" y "municipio" en la capa de features del mapa. Si los nombres de los campos son diferentes, la aplicación intentará encontrarlos automáticamente usando patrones comunes.

