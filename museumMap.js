window.mapaMuseo = {
  punto_0: {
    nombre: "Ingreso Principal - Totem de Calibracion",
    coords: { x: 0.0, y: 0.0, z: 0.0 },
    conexiones: ["sala_valdivia", "sala_ceramica"],
    umbralProximidad: 4.0,
    assets: [
      {
        id: "banner_bienvenida",
        src: "./assets/models/welcome.glb",
        posRelativa: { x: 0, y: 0, z: -2 },
        rotacion: { x: 0, y: 0, z: 0 },
        escala: { x: 1, y: 1, z: 1 }
      }
    ]
  },
  sala_valdivia: {
    nombre: "Exhibicion Estatuilla Valdivia",
    coords: { x: 5.2, y: 0.0, z: -12.4 },
    conexiones: ["punto_0", "excavacion_b"],
    umbralProximidad: 5.0,
    assets: [
      {
        id: "figura_valdivia_3d",
        src: "./assets/models/valdivia.glb",
        posRelativa: { x: 0, y: 0.5, z: 0 },
        rotacion: { x: 0, y: 45, z: 0 },
        escala: { x: 1.5, y: 1.5, z: 1.5 }
      }
    ]
  },
  excavacion_b: {
    nombre: "Area de Excavacion B",
    coords: { x: 12.4, y: 0.0, z: -18.2 },
    conexiones: ["sala_valdivia", "sala_ceramica", "mirador_conchales"],
    umbralProximidad: 4.5,
    assets: [
      {
        id: "panel_excavacion",
        src: "./assets/models/excavacion.glb",
        posRelativa: { x: 0, y: 0, z: 0 },
        rotacion: { x: 0, y: 90, z: 0 },
        escala: { x: 1, y: 1, z: 1 }
      }
    ]
  },
  sala_ceramica: {
    nombre: "Sala Ceramica Temprana",
    coords: { x: -6.6, y: 0.0, z: -9.3 },
    conexiones: ["punto_0", "excavacion_b"],
    umbralProximidad: 4.2,
    assets: [
      {
        id: "vasija_ceramica",
        src: "./assets/models/ceramica.glb",
        posRelativa: { x: 0, y: 0.2, z: -1.5 },
        rotacion: { x: 0, y: 180, z: 0 },
        escala: { x: 1.3, y: 1.3, z: 1.3 }
      }
    ]
  },
  mirador_conchales: {
    nombre: "Mirador de Conchales",
    coords: { x: 18.1, y: 0.0, z: -24.0 },
    conexiones: ["excavacion_b"],
    umbralProximidad: 6.0,
    assets: [
      {
        id: "flecha_mirador",
        src: "./assets/models/marker.glb",
        posRelativa: { x: 0, y: 0.2, z: 0 },
        rotacion: { x: 0, y: 0, z: 0 },
        escala: { x: 1, y: 1, z: 1 }
      }
    ]
  }
};