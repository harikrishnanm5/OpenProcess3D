import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyClippingPlanes,
  calculatePlaneConstant,
  createClippingPlane,
  getBoundsRangeForAxis,
  getClippingNormal,
} from './section';

describe('section pure logic', () => {
  describe('getClippingNormal', () => {
    it('returns negative unit vectors by default to keep points <= position', () => {
      expect(getClippingNormal('x')).toEqual([-1, 0, 0]);
      expect(getClippingNormal('y')).toEqual([0, -1, 0]);
      expect(getClippingNormal('z')).toEqual([0, 0, -1]);
    });

    it('returns positive unit vectors when inverted to keep points >= position', () => {
      expect(getClippingNormal('x', true)).toEqual([1, 0, 0]);
      expect(getClippingNormal('y', true)).toEqual([0, 1, 0]);
      expect(getClippingNormal('z', true)).toEqual([0, 0, 1]);
    });
  });

  describe('calculatePlaneConstant', () => {
    it('returns position when not inverted', () => {
      expect(calculatePlaneConstant('x', 10)).toBe(10);
      expect(calculatePlaneConstant('z', 1.5)).toBe(1.5);
      expect(calculatePlaneConstant('y', 0)).toBe(0);
      expect(calculatePlaneConstant('x', -5)).toBe(-5);
    });

    it('returns -position when inverted', () => {
      expect(calculatePlaneConstant('x', 10, true)).toBe(-10);
      expect(calculatePlaneConstant('z', 1.5, true)).toBe(-1.5);
      expect(calculatePlaneConstant('y', 0, true)).toBe(-0);
      expect(calculatePlaneConstant('x', -5, true)).toBe(5);
    });

    it('handles non-finite inputs by returning 0', () => {
      expect(calculatePlaneConstant('x', NaN)).toBe(0);
      expect(calculatePlaneConstant('z', Infinity)).toBe(0);
    });
  });

  describe('getBoundsRangeForAxis', () => {
    it('computes min, max, mid, and step from array-based bounds', () => {
      const bounds = {
        min: [0, 10, 0] as [number, number, number],
        max: [20, 30, 2] as [number, number, number],
      };

      const rangeX = getBoundsRangeForAxis(bounds, 'x');
      expect(rangeX.min).toBe(0);
      expect(rangeX.max).toBe(20);
      expect(rangeX.mid).toBe(10);
      expect(rangeX.step).toBeGreaterThan(0);

      const rangeY = getBoundsRangeForAxis(bounds, 'y');
      expect(rangeY.min).toBe(10);
      expect(rangeY.max).toBe(30);
      expect(rangeY.mid).toBe(20);

      const rangeZ = getBoundsRangeForAxis(bounds, 'z');
      expect(rangeZ.min).toBe(0);
      expect(rangeZ.max).toBe(2);
      expect(rangeZ.mid).toBe(1);
    });

    it('computes min, max, mid from THREE.Box3 objects', () => {
      const box = new THREE.Box3(
        new THREE.Vector3(5, 5, 1),
        new THREE.Vector3(15, 25, 3)
      );

      const rangeX = getBoundsRangeForAxis(box, 'x');
      expect(rangeX.min).toBe(5);
      expect(rangeX.max).toBe(15);
      expect(rangeX.mid).toBe(10);

      const rangeZ = getBoundsRangeForAxis(box, 'z');
      expect(rangeZ.min).toBe(1);
      expect(rangeZ.max).toBe(3);
      expect(rangeZ.mid).toBe(2);
    });
  });

  describe('createClippingPlane', () => {
    it('constructs a THREE.Plane with correct normal and constant', () => {
      const plane = createClippingPlane('x', 7.5);
      expect(plane.normal.x).toBe(-1);
      expect(plane.normal.y).toBe(0);
      expect(plane.normal.z).toBe(0);
      expect(plane.constant).toBe(7.5);

      // Verify plane evaluation: point at x=5 (5 < 7.5) should be >= 0 (kept)
      expect(plane.distanceToPoint(new THREE.Vector3(5, 0, 0))).toBeGreaterThanOrEqual(0);
      // Point at x=10 (10 > 7.5) should be < 0 (clipped)
      expect(plane.distanceToPoint(new THREE.Vector3(10, 0, 0))).toBeLessThan(0);
    });

    it('constructs inverted plane keeping the opposite half-space', () => {
      const plane = createClippingPlane('z', 1.0, true);
      expect(plane.normal.z).toBe(1);
      expect(plane.constant).toBe(-1.0);

      // Point at z=2 should be kept
      expect(plane.distanceToPoint(new THREE.Vector3(0, 0, 2))).toBeGreaterThanOrEqual(0);
      // Point at z=0.5 should be clipped
      expect(plane.distanceToPoint(new THREE.Vector3(0, 0, 0.5))).toBeLessThan(0);
    });
  });

  describe('applyClippingPlanes', () => {
    it('attaches clipping planes and enables double-side rendering on materials', () => {
      const mat1 = new THREE.MeshStandardMaterial();
      const mat2 = new THREE.MeshStandardMaterial();
      const mockLayers = [
        { mesh: new THREE.Mesh(new THREE.BufferGeometry(), mat1) },
        { mesh: new THREE.Mesh(new THREE.BufferGeometry(), mat2) },
      ];

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1.0);
      applyClippingPlanes(mockLayers as any, [plane]);

      expect(mat1.clippingPlanes).toEqual([plane]);
      expect(mat2.clippingPlanes).toEqual([plane]);
      expect(mat1.clipShadows).toBe(true);
      expect(mat1.side).toBe(THREE.DoubleSide);

      // Disabling clipping resets planes to null
      applyClippingPlanes(mockLayers as any, []);
      expect(mat1.clippingPlanes).toBeNull();
      expect(mat2.clippingPlanes).toBeNull();
    });
  });
});
