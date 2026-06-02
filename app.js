(function () {
  const scene = document.querySelector('#ar-scene');
  const worldRoot = document.querySelector('#world-root');
  const destinationSelect = document.querySelector('#destination-select');
  const planRouteButton = document.querySelector('#plan-route');
  const clearRouteButton = document.querySelector('#clear-route');
  const routeList = document.querySelector('#route-list');
  const trackingStatus = document.querySelector('#tracking-status');
  const nodeStatus = document.querySelector('#node-status');
  const routeStatus = document.querySelector('#route-status');
  const metricNodes = document.querySelector('#metric-nodes');
  const metricAssets = document.querySelector('#metric-assets');
  const metricTick = document.querySelector('#metric-tick');
  const introScreen = document.querySelector('#intro-screen');
  const enterExperienceButton = document.querySelector('#enter-experience');

  const graph = window.mapaMuseo || {};
  const graphEntries = Object.entries(graph);
  const nodeIds = graphEntries.map(([nodeId]) => nodeId);
  const appState = {
    currentNodeId: 'punto_0',
    destinationId: '',
    route: [],
    routeIndex: 0,
    lastScanAt: 0,
    lastTickDelta: 0,
    originLocked: false,
    activeAssets: new Map(),
    arrowEntity: null
  };

  if (!window.AFRAME) {
    return;
  }

  if (!AFRAME.components['look-at']) {
    AFRAME.registerComponent('look-at', {
      schema: {
        target: { type: 'vec3' }
      },
      tick() {
        const target = this.data.target;
        if (!target) {
          return;
        }
        const vector = new THREE.Vector3(target.x, target.y, target.z);
        this.el.object3D.lookAt(vector);
      }
    });
  }

  AFRAME.registerComponent('gestor-navegacion', {
    tick(time, timeDelta) {
      appState.lastTickDelta = Math.round(timeDelta || 0);
      metricTick.textContent = `${appState.lastTickDelta} ms`;

      if (time - appState.lastScanAt < 500) {
        return;
      }

      appState.lastScanAt = time;

      if (!scene.object3D || !scene.camera) {
        return;
      }

      const cameraPosition = new THREE.Vector3();
      scene.camera.el.object3D.getWorldPosition(cameraPosition);

      if (!appState.originLocked) {
        updateTrackingState('Esperando marcador', 'pill pill-waiting');
      }

      let nearestNodeId = appState.currentNodeId;
      let nearestDistance = Number.POSITIVE_INFINITY;

      graphEntries.forEach(([nodeId, node]) => {
        const distance = distance2D(cameraPosition, node.coords);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestNodeId = nodeId;
        }

        if (distance <= node.umbralProximidad) {
          loadNodeAssets(nodeId);
        } else if (nodeId !== appState.currentNodeId) {
          unloadNodeAssets(nodeId);
        }
      });

      if (nearestDistance < Number.POSITIVE_INFINITY) {
        appState.currentNodeId = nearestNodeId;
      }

      updateNodeIndicators();
      advanceRouteIfNeeded(cameraPosition);
      syncArrow();
      metricAssets.textContent = String(appState.activeAssets.size);
    }
  });

  function updateTrackingState(text, className) {
    trackingStatus.textContent = text;
    trackingStatus.className = className;
  }

  function updateNodeIndicators() {
    const node = graph[appState.currentNodeId];
    if (node) {
      nodeStatus.textContent = `Nodo activo: ${node.nombre}`;
    }

    if (appState.route.length > 0) {
      routeStatus.textContent = `Ruta: ${appState.route.length} nodos`;
    } else {
      routeStatus.textContent = 'Ruta: --';
    }
  }

  function distance2D(cameraPosition, nodeCoords) {
    const deltaX = nodeCoords.x - cameraPosition.x;
    const deltaZ = nodeCoords.z - cameraPosition.z;
    return Math.sqrt((deltaX * deltaX) + (deltaZ * deltaZ));
  }

  function createAssetEntity(asset) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('id', asset.id);
    entity.setAttribute('gltf-model', asset.src);
    entity.setAttribute('position', `${asset.posRelativa.x} ${asset.posRelativa.y} ${asset.posRelativa.z}`);
    entity.setAttribute('rotation', `${asset.rotacion.x} ${asset.rotacion.y} ${asset.rotacion.z}`);
    entity.setAttribute('scale', `${asset.escala.x} ${asset.escala.y} ${asset.escala.z}`);
    entity.setAttribute('shadow', 'cast: true; receive: true');
    entity.addEventListener('model-error', () => {
      entity.removeAttribute('gltf-model');
      entity.setAttribute('geometry', 'primitive: box');
      entity.setAttribute('material', 'color: #d79b56; metalness: 0.1; roughness: 0.85');
      entity.setAttribute('scale', `${asset.escala.x * 0.9} ${asset.escala.y * 0.9} ${asset.escala.z * 0.9}`);
      entity.setAttribute('visible', 'true');
    });
    return entity;
  }

  function ensureNodeAnchor(nodeId) {
    let wrapper = appState.activeAssets.get(nodeId);
    if (wrapper) {
      return wrapper;
    }

    wrapper = document.createElement('a-entity');
    wrapper.setAttribute('id', `node-${nodeId}`);
    wrapper.setAttribute('position', `${graph[nodeId].coords.x} ${graph[nodeId].coords.y} ${graph[nodeId].coords.z}`);
    wrapper.setAttribute('data-node-id', nodeId);
    worldRoot.appendChild(wrapper);
    appState.activeAssets.set(nodeId, wrapper);
    return wrapper;
  }

  function loadNodeAssets(nodeId) {
    const node = graph[nodeId];
    if (!node) {
      return;
    }

    const wrapper = ensureNodeAnchor(nodeId);
    if (wrapper.dataset.loaded === 'true') {
      return;
    }

    node.assets.forEach((asset) => {
      wrapper.appendChild(createAssetEntity(asset));
    });

    wrapper.dataset.loaded = 'true';
  }

  function unloadNodeAssets(nodeId) {
    if (nodeId === appState.currentNodeId) {
      return;
    }

    const wrapper = appState.activeAssets.get(nodeId);
    if (!wrapper) {
      return;
    }

    wrapper.remove();
    appState.activeAssets.delete(nodeId);
  }

  function findPath(startNodeId, goalNodeId) {
    if (startNodeId === goalNodeId) {
      return [startNodeId];
    }

    const queue = [[startNodeId]];
    const visited = new Set([startNodeId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currentNodeId = path[path.length - 1];

      if (currentNodeId === goalNodeId) {
        return path;
      }

      const currentNode = graph[currentNodeId];
      if (!currentNode) {
        continue;
      }

      currentNode.conexiones.forEach((neighborId) => {
        if (visited.has(neighborId)) {
          return;
        }

        visited.add(neighborId);
        queue.push([...path, neighborId]);
      });
    }

    return [];
  }

  function renderRoute(route) {
    routeList.innerHTML = '';
    if (!route.length) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = 'Sin ruta activa.';
      routeList.appendChild(emptyItem);
      return;
    }

    route.forEach((nodeId, index) => {
      const item = document.createElement('li');
      item.textContent = `${index + 1}. ${graph[nodeId].nombre}`;
      routeList.appendChild(item);
    });
  }

  function syncArrow() {
    if (appState.route.length < 2 || appState.routeIndex >= appState.route.length) {
      if (appState.arrowEntity) {
        appState.arrowEntity.remove();
        appState.arrowEntity = null;
      }
      return;
    }

    const currentNodeId = appState.route[appState.routeIndex - 1] || appState.route[0];
    const nextNodeId = appState.route[appState.routeIndex];
    const currentNode = graph[currentNodeId];
    const nextNode = graph[nextNodeId];

    if (!appState.arrowEntity) {
      appState.arrowEntity = document.createElement('a-entity');
      appState.arrowEntity.setAttribute('geometry', 'primitive: cone; radiusBottom: 0.18; radiusTop: 0.01; height: 0.75');
      appState.arrowEntity.setAttribute('material', 'color: #f0b66d; metalness: 0.15; roughness: 0.55');
      appState.arrowEntity.setAttribute('shadow', 'cast: true');
      worldRoot.appendChild(appState.arrowEntity);
    }

    appState.arrowEntity.setAttribute('position', `${currentNode.coords.x} ${currentNode.coords.y + 1.2} ${currentNode.coords.z}`);
    appState.arrowEntity.setAttribute('look-at', `target: ${nextNode.coords.x} ${nextNode.coords.y + 1.2} ${nextNode.coords.z}`);
  }

  function advanceRouteIfNeeded(cameraPosition) {
    if (appState.route.length < 2 || appState.routeIndex >= appState.route.length) {
      return;
    }

    const nextNodeId = appState.route[appState.routeIndex];
    const nextNode = graph[nextNodeId];
    const distance = distance2D(cameraPosition, nextNode.coords);

    if (distance <= nextNode.umbralProximidad) {
      appState.currentNodeId = nextNodeId;
      appState.routeIndex += 1;

      if (appState.routeIndex >= appState.route.length) {
        routeStatus.textContent = 'Ruta completada';
        appState.route = [];
        appState.routeIndex = 0;
      }
    }
  }

  function populateDestinationOptions() {
    destinationSelect.innerHTML = '';
    nodeIds.forEach((nodeId) => {
      if (nodeId === 'punto_0') {
        return;
      }

      const option = document.createElement('option');
      option.value = nodeId;
      option.textContent = graph[nodeId].nombre;
      destinationSelect.appendChild(option);
    });
    appState.destinationId = destinationSelect.value || '';
  }

  function setDestination(nodeId) {
    appState.destinationId = nodeId;
  }

  function planRoute() {
    if (!appState.destinationId) {
      return;
    }

    const route = findPath(appState.currentNodeId, appState.destinationId);
    if (!route.length) {
      renderRoute([]);
      routeStatus.textContent = 'Sin ruta disponible';
      return;
    }

    appState.route = route;
    appState.routeIndex = route.length > 1 ? 1 : 0;
    renderRoute(route);
    syncArrow();
  }

  function clearRoute() {
    appState.route = [];
    appState.routeIndex = 0;
    routeStatus.textContent = 'Ruta: --';
    renderRoute([]);
    syncArrow();
  }

  function bindEvents() {
    destinationSelect.addEventListener('change', (event) => {
      setDestination(event.target.value);
    });

    planRouteButton.addEventListener('click', planRoute);
    clearRouteButton.addEventListener('click', clearRoute);

    const targetEntity = document.querySelector('#origin-target');
    targetEntity.addEventListener('targetFound', () => {
      appState.originLocked = true;
      updateTrackingState('Marcador detectado', 'pill');
    });

    targetEntity.addEventListener('targetLost', () => {
      appState.originLocked = false;
      updateTrackingState('Marcador perdido', 'pill pill-waiting');
    });
  }

  function bootstrap() {
    metricNodes.textContent = String(nodeIds.length);
    metricAssets.textContent = '0';
    renderRoute([]);
    populateDestinationOptions();
    bindEvents();
    updateNodeIndicators();
    updateTrackingState('Esperando marcador', 'pill pill-waiting');
    loadNodeAssets('punto_0');
  }

  function enterExperience() {
    document.body.classList.add('ar-active');

    if (introScreen) {
      introScreen.setAttribute('hidden', 'hidden');
    }

    if (scene && typeof scene.enterVR === 'function') {
      scene.enterVR();
    }
  }

  if (enterExperienceButton) {
    enterExperienceButton.addEventListener('click', enterExperience);
  }

  scene.addEventListener('loaded', bootstrap);
})();