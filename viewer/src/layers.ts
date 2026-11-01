/**
 * Layer Controls and Explode Manager for OpenProcess3D Viewer.
 */

import * as THREE from 'three';
import { LoadedLayer } from './loader';

/**
 * Calculates vertical explode offset along Z for a layer.
 * Offset is computed as layerIndex * factor.
 * When factor is 0, offset is 0 (true original positions).
 *
 * @param layerIndex 0-based index of layer in the process stack
 * @param factor Explode distance multiplier in microns (>= 0)
 * @returns Offset to apply to mesh.position.z
 */
export function calculateExplodeOffset(layerIndex: number, factor: number): number {
  if (layerIndex < 0 || factor <= 0 || !Number.isFinite(factor)) {
    return 0;
  }
  return layerIndex * factor;
}

/**
 * Sets visibility of a 3D mesh.
 */
export function setLayerVisibility(mesh: { visible: boolean }, visible: boolean): void {
  mesh.visible = Boolean(visible);
}

/**
 * Applies explode offsets to an array of layers without altering geometry.
 * Only modifies mesh.position.z.
 */
export function applyExplode(
  layers: Array<{ mesh: { position: { z: number } } }>,
  factor: number
): void {
  for (let idx = 0; idx < layers.length; idx++) {
    layers[idx].mesh.position.z = calculateExplodeOffset(idx, factor);
  }
}

/**
 * Helper to extract hex color string from a Three.js material.
 */
export function getLayerColorHex(mesh: THREE.Mesh): string {
  if (mesh.material) {
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if ('color' in mat && mat.color instanceof THREE.Color) {
      return '#' + mat.color.getHexString();
    }
  }
  return '#888888';
}

export interface LayerControlsHandle {
  element: HTMLElement;
  setExplodeFactor: (factor: number) => void;
  getExplodeFactor: () => number;
}

/**
 * Creates the layer control panel DOM element with layer list, swatches,
 * visibility checkboxes, approx badges, and the explode slider.
 */
export function createLayerControls(
  layers: LoadedLayer[],
  onExplodeChange?: (factor: number) => void
): LayerControlsHandle {
  const panel = document.createElement('div');
  panel.className = 'controls-section layers-panel';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Process Layers';
  panel.appendChild(title);

  // Explode slider control
  const explodeGroup = document.createElement('div');
  explodeGroup.className = 'control-group explode-group';

  const explodeHeader = document.createElement('div');
  explodeHeader.className = 'control-header';

  const explodeLabel = document.createElement('label');
  explodeLabel.htmlFor = 'explode-slider';
  explodeLabel.textContent = 'Explode Stack:';

  const explodeValue = document.createElement('span');
  explodeValue.id = 'explode-value';
  explodeValue.className = 'value-display';
  explodeValue.textContent = '0.0 um';

  explodeHeader.appendChild(explodeLabel);
  explodeHeader.appendChild(explodeValue);
  explodeGroup.appendChild(explodeHeader);

  const explodeSlider = document.createElement('input');
  explodeSlider.type = 'range';
  explodeSlider.id = 'explode-slider';
  explodeSlider.className = 'range-slider';
  explodeSlider.min = '0';
  explodeSlider.max = '5';
  explodeSlider.step = '0.1';
  explodeSlider.value = '0';

  const updateExplodeUI = (factor: number): void => {
    explodeValue.textContent = `${factor.toFixed(1)} um`;
    applyExplode(layers, factor);
    if (onExplodeChange) {
      onExplodeChange(factor);
    }
  };

  explodeSlider.addEventListener('input', () => {
    const factor = parseFloat(explodeSlider.value) || 0;
    updateExplodeUI(factor);
  });

  explodeGroup.appendChild(explodeSlider);
  panel.appendChild(explodeGroup);

  // Layer list
  const list = document.createElement('ul');
  list.className = 'layer-list';

  layers.forEach((layer, idx) => {
    const item = document.createElement('li');
    item.className = 'layer-item';

    const label = document.createElement('label');
    label.className = 'layer-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'layer-checkbox';
    checkbox.checked = layer.mesh.visible;
    checkbox.dataset.layerIndex = String(idx);
    checkbox.addEventListener('change', () => {
      setLayerVisibility(layer.mesh, checkbox.checked);
    });

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = getLayerColorHex(layer.mesh);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'layer-name';
    nameSpan.textContent = layer.name;

    const matSpan = document.createElement('span');
    matSpan.className = 'layer-material';
    matSpan.textContent = `(${layer.material})`;

    label.appendChild(checkbox);
    label.appendChild(swatch);
    label.appendChild(nameSpan);
    label.appendChild(matSpan);

    if (layer.approx) {
      const approxBadge = document.createElement('span');
      approxBadge.className = 'badge-approx';
      approxBadge.textContent = 'approx';
      approxBadge.title = 'Approximated dimensions';
      label.appendChild(approxBadge);
    }

    item.appendChild(label);
    list.appendChild(item);
  });

  panel.appendChild(list);

  return {
    element: panel,
    setExplodeFactor: (factor: number) => {
      explodeSlider.value = String(factor);
      updateExplodeUI(factor);
    },
    getExplodeFactor: () => parseFloat(explodeSlider.value) || 0,
  };
}
