// Cargar módulos usando $arcgis.import() según la documentación oficial
const [WebMap, MapView, Legend, ScaleBar, FeatureLayer, Zoom, Home, Search, Fullscreen] = await Promise.all([
    $arcgis.import("esri/WebMap"),
    $arcgis.import("esri/views/MapView"),
    $arcgis.import("esri/widgets/Legend"),
    $arcgis.import("esri/widgets/ScaleBar"),
    $arcgis.import("esri/layers/FeatureLayer"),
    $arcgis.import("esri/widgets/Zoom"),
    $arcgis.import("esri/widgets/Home"),
    $arcgis.import("esri/widgets/Search"),
    $arcgis.import("esri/widgets/Fullscreen")
]);

// ID del webmap de ArcGIS
const webmapId = "b8da8d6cd1c94f45b754b9f9f9002c21";

// Referencias a elementos del DOM
const viewDiv = document.getElementById("viewDiv");
const loadingOverlay = document.getElementById("loading");
const actividadFilter = document.getElementById("actividad-filter");
const municipioFilter = document.getElementById("municipio-filter");
const applyFiltersBtn = document.getElementById("apply-filters");
const resetFiltersBtn = document.getElementById("reset-filters");
const resultsCount = document.getElementById("results-count");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.querySelector(".sidebar");

let webmap = null;
let view = null;
let featureLayer = null;
let uniqueActividades = [];
let uniqueMunicipios = [];

// Inicializar mapa
function initializeMap() {
    webmap = new WebMap({
        portalItem: {
            id: webmapId
        }
    });
    
    view = new MapView({
        container: viewDiv,
        map: webmap,
        center: [-103.35, 20.65], // Coordenadas aproximadas de Jalisco
        zoom: 10
    });
    
    // Agregar widgets al mapa
    view.when(() => {
        // Obtener la primera capa de features (FeatureLayer)
        const layers = webmap.layers;
        
        layers.forEach((layer) => {
            if (layer.type === "feature") {
                featureLayer = layer;
                setupLayerFilters();
                return;
            }
        });
        
        // Si no hay capa de features, buscar en los layers anidados
        if (!featureLayer) {
            layers.forEach((layer) => {
                if (layer.layers) {
                    layer.layers.forEach((sublayer) => {
                        if (sublayer.type === "feature" && !featureLayer) {
                            featureLayer = sublayer;
                            setupLayerFilters();
                        }
                    });
                }
            });
        }
        
        // Agregar widgets de navegación estándar de ArcGIS
        
        // Widget de Zoom (botones + y -)
        const zoom = new Zoom({
            view: view
        });
        view.ui.add(zoom, "top-left");
        
        // Widget de Home (centrar mapa)
        const home = new Home({
            view: view
        });
        view.ui.add(home, "top-left");
        
        // Widget de búsqueda
        const search = new Search({
            view: view
        });
        view.ui.add(search, "top-left");
        
        // Widget de pantalla completa
        const fullscreen = new Fullscreen({
            view: view
        });
        view.ui.add(fullscreen, "top-left");
        
        // Agregar widget de leyenda si hay capas
        if (webmap.layers.length > 0) {
            const legend = new Legend({
                view: view,
                container: document.createElement("div")
            });
            
            view.ui.add(legend, "bottom-right");
        }
        
        // Agregar escala
        const scaleBar = new ScaleBar({
            view: view,
            unit: "metric"
        });
        
        view.ui.add(scaleBar, {
            position: "bottom-left"
        });
        
        // Ocultar loading
        loadingOverlay.classList.add("hidden");
    });
    
    view.when(function() {
        console.log("Mapa cargado correctamente");
    }).otherwise(function(error) {
        console.error("Error al cargar el mapa:", error);
        loadingOverlay.innerHTML = "<p style='color: red;'>Error al cargar el mapa. Por favor, verifica la conexión.</p>";
    });
}

// Configurar filtros de la capa
function setupLayerFilters() {
    if (!featureLayer) {
        console.warn("No se encontró una capa de features");
        return;
    }
    
    // Esperar a que la capa se cargue
    featureLayer.when(() => {
        // Obtener valores únicos de los campos
        getUniqueValues(featureLayer).then((values) => {
            uniqueActividades = values.actividades || [];
            uniqueMunicipios = values.municipios || [];
            
            // Almacenar nombres de campos para usar en filtros
            featureLayer._actividadField = values.actividadField;
            featureLayer._municipioField = values.municipioField;
            
            // Llenar los selects
            populateSelect(actividadFilter, uniqueActividades);
            populateSelect(municipioFilter, uniqueMunicipios);
            
            // Actualizar contador inicial
            updateResultsCount();
            
            // Configurar event listeners
            setupEventListeners();
        });
    });
}

// Obtener valores únicos de los campos
function getUniqueValues(layer) {
    return new Promise((resolve, reject) => {
        const query = layer.createQuery();
        query.where = "1=1";
        query.outFields = ["*"];
        query.returnGeometry = false;
        
        // Buscar los nombres exactos de los campos
        const actividadFieldName = findExactField(layer, "Nombre de clase de la actividad");
        const municipioFieldName = findExactField(layer, "Municipio");
        
        layer.queryFeatures(query).then((results) => {
            const actividades = new Set();
            const municipios = new Set();
            
            results.features.forEach((feature) => {
                const attributes = feature.attributes;
                
                // Usar los nombres exactos de los campos
                if (actividadFieldName && attributes[actividadFieldName]) {
                    actividades.add(attributes[actividadFieldName]);
                }
                
                if (municipioFieldName && attributes[municipioFieldName]) {
                    municipios.add(attributes[municipioFieldName]);
                }
            });
            
            resolve({
                actividades: Array.from(actividades).sort(),
                municipios: Array.from(municipios).sort(),
                actividadField: actividadFieldName,
                municipioField: municipioFieldName
            });
        }).catch((error) => {
            console.error("Error al obtener valores únicos:", error);
            reject(error);
        });
    });
}

// Llenar select con valores
function populateSelect(selectElement, values) {
    // Mantener la opción "Todos"
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = "";
    selectElement.appendChild(firstOption);
    
    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Aplicar filtros
    applyFiltersBtn.addEventListener("click", () => {
        applyFilters();
    });
    
    // Resetear filtros
    resetFiltersBtn.addEventListener("click", () => {
        resetFilters();
    });
    
    // Toggle sidebar en móvil
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("hidden");
        });
    }
}

// Aplicar filtros
function applyFilters() {
    if (!featureLayer) return;
    
    const actividadValue = actividadFilter.value;
    const municipioValue = municipioFilter.value;
    
    let whereClause = "1=1";
    const conditions = [];
    
    // Usar los nombres exactos de los campos almacenados
    const actividadField = featureLayer._actividadField || findExactField(featureLayer, "Nombre de clase de la actividad");
    const municipioField = featureLayer._municipioField || findExactField(featureLayer, "Municipio");
    
    if (actividadValue && actividadField) {
        conditions.push(`${actividadField} = '${actividadValue.replace(/'/g, "''")}'`);
    }
    
    if (municipioValue && municipioField) {
        conditions.push(`${municipioField} = '${municipioValue.replace(/'/g, "''")}'`);
    }
    
    if (conditions.length > 0) {
        whereClause = conditions.join(" AND ");
    }
    
    // Aplicar filtro a la capa
    featureLayer.definitionExpression = whereClause;
    
    // Actualizar contador
    updateResultsCount();
}

// Buscar campo por nombre exacto
function findExactField(layer, fieldName) {
    if (!layer.fields) return null;
    
    // Buscar coincidencia exacta (case-insensitive)
    for (let field of layer.fields) {
        if (field.name === fieldName || field.name.toLowerCase() === fieldName.toLowerCase()) {
            return field.name; // Retornar el nombre real del campo (puede tener diferente capitalización)
        }
    }
    
    // Si no se encuentra, buscar también en alias
    for (let field of layer.fields) {
        if (field.alias && (field.alias === fieldName || field.alias.toLowerCase() === fieldName.toLowerCase())) {
            return field.name;
        }
    }
    
    return null;
}

// Resetear filtros
function resetFilters() {
    actividadFilter.value = "";
    municipioFilter.value = "";
    
    if (featureLayer) {
        featureLayer.definitionExpression = "1=1";
        updateResultsCount();
    }
}

// Actualizar contador de resultados
function updateResultsCount() {
    if (!featureLayer) {
        resultsCount.textContent = "Sin datos";
        return;
    }
    
    const query = featureLayer.createQuery();
    query.where = featureLayer.definitionExpression || "1=1";
    query.returnGeometry = false;
    
    featureLayer.queryFeatureCount(query).then((count) => {
        resultsCount.textContent = `${count} elemento${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }).catch((error) => {
        console.error("Error al contar features:", error);
        resultsCount.textContent = "Error al contar";
    });
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMap);
} else {
    initializeMap();
}
