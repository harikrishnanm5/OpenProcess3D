/**
 * Cross-section / Clipping Plane Manager for OpenProcess3D Viewer.
 */

import * as THREE from 'three';
import { BoundsData, LoadedLayer } from './loader';

export type SectionAxis = 'x' | 'y' | 'z';

export interface AxisRange {
  min: number;
  max: number;
  mid: number;
  step: number;
}

export type BoundsLike =
  | BoundsData
  | THREE.Box3
  | {
      min: [number, number, number] | { x: number; y: number; z: number };
      max: [number, number, number] | { x: number; y: number; z: number };
    };

/**
 * Returns the clipping plane normal vector components [x, y, z] for a given axis.
 * By default, normal points in negative axis direction to retain points where coord <= position.
 * When inverted is true, normal points in positive axis direction to retain points where coord >= position.
 */
export function getClippingNormal(axis: SectionAxis, inverted = false): [number, number, number] {
  const sign = inverted ? 1 : -1;
  switch (axis) {
    case 'x':
      return [sign, 0, 0];
    case 'y':
      return [0, sign, 0];
    case 'z':
      return [0, 0, sign];
  }
}

/**
 * Computes the Three.js Plane constant for a cut at the specified position.
 * For normal (-1, 0, 0): N . P + d >= 0  =>  -x + d >= 0  =>  x <= d.
 * For normal ( 1, 0, 0): N . P + d >= 0  =>   x + d >= 0  =>  x >= -d.
 */
export function calculatePlaneConstant(
  _axis: SectionAxis,
  position: number,
  inverted = false
): number {
  if (!Number.isFinite(position)) {
    return 0;
  }
  return inverted ? -position : position;
}

/**
 * Extracts min, max, midpoint, and slider step for a given axis from bounding box coordinates.
 */
export function getBoundsRangeForAxis(bounds: BoundsLike, axis: SectionAxis): AxisRange {
  const getCoord = (
    v: [number, number, number] | { x: number; y: number; z: number },
    ax: SectionAxis
  ): number => {
    if (Array.isArray(v)) {
      const idx = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
      return v[idx];
    }
    return v[ax];
  };

  const min = getCoord(bounds.min, axis);
  const max = getCoord(bounds.max, axis);
  const span = Math.max(0.001, max - min);
  const mid = (min + max) / 2;
  const step = Math.max(0.001, parseFloat((span / 200).toFixed(4)));

  return { min, max, mid, step };
}

/**
 * Constructs a THREE.Plane configured for cross-section clipping.
 */
export function createClippingPlane(
  axis: SectionAxis,
  position: number,
  inverted = false
): THREE.Plane {
  const [nx, ny, nz] = getClippingNormal(axis, inverted);
  const constant = calculatePlaneConstant(axis, position, inverted);
  return new THREE.Plane(new THREE.Vector3(nx, ny, nz), constant);
}

/**
 * Applies clipping planes to all layer materials in the scene.
 */
export function applyClippingPlanes(
  layers: Array<{ mesh: THREE.Mesh }>,
  planes: THREE.Plane[]
): void {
  const activePlanes = planes.length > 0 ? planes : null;
  for (const layer of layers) {
    const materials = Array.isArray(layer.mesh.material)
      ? layer.mesh.material
      : [layer.mesh.material];

    for (const mat of materials) {
      if (mat) {
        mat.clippingPlanes = activePlanes;
        mat.clipShadows = true;
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
      }
    }
  }
}

export interface SectionControlsHandle {
  element: HTMLElement;
  plane: THREE.Plane;
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
  setAxis: (axis: SectionAxis) => void;
  setPosition: (position: number) => void;
  setInverted: (inverted: boolean) => void;
}

/**
 * Creates the cross-section control panel DOM elements.
 */
export function createSectionControls(
  layers: LoadedLayer[],
  bounds: THREE.Box3,
  onSectionChange?: () => void
): SectionControlsHandle {
  const panel = document.createElement('div');
  panel.className = 'controls-section section-panel';

  const title = document.createElement('h3');
  title.className = 'section-title';
  title.textContent = 'Cross-Section';
  panel.appendChild(title);

  // Enable/disable checkbox
  const enableRow = document.createElement('div');
  enableRow.className = 'control-row';

  const enableCheckbox = document.createElement('input');
  enableCheckbox.type = 'checkbox';
  enableCheckbox.id = 'section-enable';
  enableCheckbox.className = 'section-checkbox';

  const enableLabel = document.createElement('label');
  enableLabel.htmlFor = 'section-enable';
  enableLabel.textContent = 'Enable Cut';

  enableRow.appendChild(enableCheckbox);
  enableRow.appendChild(enableLabel);
  panel.appendChild(enableRow);

  // Cut axis selector
  const axisGroup = document.createElement('div');
  axisGroup.className = 'control-group';

  const axisLabel = document.createElement('label');
  axisLabel.htmlFor = 'section-axis';
  axisLabel.textContent = 'Cut Axis:';

  const axisSelect = document.createElement('select');
  axisSelect.id = 'section-axis';
  axisSelect.className = 'control-select';

  const axes: Array<{ value: SectionAxis; label: string }> = [
    { value: 'z', label: 'Z (Vertical / Height)' },
    { value: 'x', label: 'X (Wafer Width)' },
    { value: 'y', label: 'Y (Wafer Length)' },
  ];

  axes.forEach((ax) => {
    const opt = document.createElement('option');
    opt.value = ax.value;
    opt.textContent = ax.label;
    if (ax.value === 'z') {
      opt.selected = true;
    }
    axisSelect.appendChild(opt);
  });

  axisGroup.appendChild(axisLabel);
  axisGroup.appendChild(axisSelect);
  panel.appendChild(axisGroup);

  // Cut position slider
  const positionGroup = document.createElement('div');
  positionGroup.className = 'control-group';

  const positionHeader = document.createElement('div');
  positionHeader.className = 'control-header';

  const positionLabel = document.createElement('label');
  positionLabel.htmlFor = 'section-position';
  positionLabel.textContent = 'Position:';

  const positionValue = document.createElement('span');
  positionValue.id = 'section-position-val';
  positionValue.className = 'value-display';

  positionHeader.appendChild(positionLabel);
  positionHeader.appendChild(positionValue);
  positionGroup.appendChild(positionHeader);

  const positionSlider = document.createElement('input');
  positionSlider.type = 'range';
  positionSlider.id = 'section-position';
  positionSlider.className = 'range-slider';

  positionGroup.appendChild(positionSlider);
  panel.appendChild(positionGroup);

  // Invert / flip direction checkbox
  const invertRow = document.createElement('div');
  invertRow.className = 'control-row';

  const invertCheckbox = document.createElement('input');
  invertCheckbox.type = 'checkbox';
  invertCheckbox.id = 'section-invert';
  invertCheckbox.className = 'section-checkbox';

  const invertLabel = document.createElement('label');
  invertLabel.htmlFor = 'section-invert';
  invertLabel.textContent = 'Flip Cut Side';

  invertRow.appendChild(invertCheckbox);
  invertRow.appendChild(invertLabel);
  panel.appendChild(invertRow);

  // State management
  let currentAxis: SectionAxis = 'z';
  let isCutEnabled = false;
  let isInverted = false;
  const clippingPlane = createClippingPlane(currentAxis, 0, isInverted);

  const updateSliderBounds = (axis: SectionAxis): void => {
    const range = getBoundsRangeForAxis(bounds, axis);
    positionSlider.min = String(range.min);
    positionSlider.max = String(range.max);
    positionSlider.step = String(range.step);
    positionSlider.value = String(range.mid);
    positionValue.textContent = `${range.mid.toFixed(2)} um`;
  };

  const updateClipping = (): void => {
    const pos = parseFloat(positionSlider.value);
    positionValue.textContent = `${pos.toFixed(2)} um`;

    const [nx, ny, nz] = getClippingNormal(currentAxis, isInverted);
    clippingPlane.normal.set(nx, ny, nz);
    clippingPlane.constant = calculatePlaneConstant(currentAxis, pos, isInverted);

    if (isCutEnabled) {
      applyClippingPlanes(layers, [clippingPlane]);
    } else {
      applyClippingPlanes(layers, []);
    }

    if (onSectionChange) {
      onSectionChange();
    }
  };

  // Initialize slider with Z axis range
  updateSliderBounds(currentAxis);

  enableCheckbox.addEventListener('change', () => {
    isCutEnabled = enableCheckbox.checked;
    updateClipping();
  });

  axisSelect.addEventListener('change', () => {
    currentAxis = axisSelect.value as SectionAxis;
    updateSliderBounds(currentAxis);
    updateClipping();
  });

  positionSlider.addEventListener('input', () => {
    updateClipping();
  });

  invertCheckbox.addEventListener('change', () => {
    isInverted = invertCheckbox.checked;
    updateClipping();
  });

  return {
    element: panel,
    plane: clippingPlane,
    isEnabled: () => isCutEnabled,
    setEnabled: (enabled: boolean) => {
      enableCheckbox.checked = enabled;
      isCutEnabled = enabled;
      updateClipping();
    },
    setAxis: (axis: SectionAxis) => {
      axisSelect.value = axis;
      currentAxis = axis;
      updateSliderBounds(axis);
      updateClipping();
    },
    setPosition: (position: number) => {
      positionSlider.value = String(position);
      updateClipping();
    },
    setInverted: (inverted: boolean) => {
      invertCheckbox.checked = inverted;
      isInverted = inverted;
      updateClipping();
    },
  };
}
