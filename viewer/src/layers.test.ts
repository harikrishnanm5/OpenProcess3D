import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyExplode,
  calculateExplodeOffset,
  getLayerColorHex,
  setLayerVisibility,
} from './layers';

describe('layers pure logic', () => {
  describe('calculateExplodeOffset', () => {
    it('returns 0 when factor is 0 regardless of layer index', () => {
      expect(calculateExplodeOffset(0, 0)).toBe(0);
      expect(calculateExplodeOffset(1, 0)).toBe(0);
      expect(calculateExplodeOffset(5, 0)).toBe(0);
    });

    it('returns 0 for the first layer (index 0) regardless of factor', () => {
      expect(calculateExplodeOffset(0, 1.5)).toBe(0);
      expect(calculateExplodeOffset(0, 10.0)).toBe(0);
    });

    it('calculates index * factor for positive indices and factors', () => {
      expect(calculateExplodeOffset(1, 0.5)).toBeCloseTo(0.5);
      expect(calculateExplodeOffset(2, 0.5)).toBeCloseTo(1.0);
      expect(calculateExplodeOffset(3, 2.0)).toBeCloseTo(6.0);
      expect(calculateExplodeOffset(4, 1.25)).toBeCloseTo(5.0);
    });

    it('handles negative or invalid inputs gracefully by returning 0', () => {
      expect(calculateExplodeOffset(-1, 2.0)).toBe(0);
      expect(calculateExplodeOffset(2, -1.0)).toBe(0);
      expect(calculateExplodeOffset(2, NaN)).toBe(0);
      expect(calculateExplodeOffset(2, Infinity)).toBe(0);
    });
  });

  describe('applyExplode', () => {
    it('updates mesh.position.z according to layer index and factor', () => {
      const mockLayers = [
        { mesh: { position: { x: 1, y: 2, z: 0 } } },
        { mesh: { position: { x: 3, y: 4, z: 0 } } },
        { mesh: { position: { x: 5, y: 6, z: 0 } } },
      ];

      applyExplode(mockLayers, 1.5);

      expect(mockLayers[0].mesh.position.z).toBeCloseTo(0);
      expect(mockLayers[1].mesh.position.z).toBeCloseTo(1.5);
      expect(mockLayers[2].mesh.position.z).toBeCloseTo(3.0);

      // Verify X and Y remain untouched
      expect(mockLayers[0].mesh.position.x).toBe(1);
      expect(mockLayers[0].mesh.position.y).toBe(2);
      expect(mockLayers[1].mesh.position.x).toBe(3);
      expect(mockLayers[1].mesh.position.y).toBe(4);
    });

    it('resets mesh.position.z to 0 when factor is 0', () => {
      const mockLayers = [
        { mesh: { position: { x: 0, y: 0, z: 2.5 } } },
        { mesh: { position: { x: 0, y: 0, z: 5.0 } } },
      ];

      applyExplode(mockLayers, 0);

      expect(mockLayers[0].mesh.position.z).toBe(0);
      expect(mockLayers[1].mesh.position.z).toBe(0);
    });
  });

  describe('setLayerVisibility', () => {
    it('sets mesh visible property', () => {
      const mockMesh = { visible: true };

      setLayerVisibility(mockMesh, false);
      expect(mockMesh.visible).toBe(false);

      setLayerVisibility(mockMesh, true);
      expect(mockMesh.visible).toBe(true);
    });
  });

  describe('getLayerColorHex', () => {
    it('extracts hex color string from Three.js MeshStandardMaterial', () => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
      const mesh = new THREE.Mesh(geometry, material);

      const hex = getLayerColorHex(mesh);
      expect(hex.toLowerCase()).toBe('#4caf50');
    });

    it('returns fallback color when material has no color', () => {
      const mesh = new THREE.Mesh();
      mesh.material = undefined as any;
      expect(getLayerColorHex(mesh)).toBe('#888888');
    });
  });
});

