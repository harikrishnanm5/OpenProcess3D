"""Integration test for SkyWater 130nm standard cell inverter."""

from pathlib import Path
import gdstk
import pytest

from core.layout.gds_loader import load_gds
from core.stack.extrude import extrude
from core.stack.layer_stack import load_stack


def test_sky130_inverter_extrusion_and_bounds() -> None:
    """Verify loading real Sky130 inverter GDS with stack.yaml.

    Checks:
    1. No layer defined in stack.yaml is silently skipped.
    2. Overall mesh bounds in x and y match the GDS layout bounding box.
    3. Each layer's z extents match the base z and thickness in stack.yaml.
    """
    gds_path = Path("examples/sky130_fd_sc_hd__inv_1.gds")
    stack_path = Path("pdks/sky130/stack.yaml")

    assert gds_path.is_file(), f"Missing GDS layout file: {gds_path}"
    assert stack_path.is_file(), f"Missing stack definition: {stack_path}"

    polygons_by_layer = load_gds(gds_path)
    stack = load_stack(stack_path)
    meshes = extrude(polygons_by_layer, stack)

    # 1. No layer defined in stack.yaml is silently skipped
    expected_layer_names = {layer.name for layer in stack}
    assert set(meshes.keys()) == expected_layer_names
    assert len(meshes) == len(stack)

    for layer in stack:
        mesh = meshes[layer.name]
        assert mesh is not None
        assert len(mesh.vertices) > 0
        assert len(mesh.faces) > 0
        assert mesh.volume > 0

    # 2. Overall mesh bounds match GDS bbox in x and y
    lib = gdstk.read_gds(str(gds_path))
    top_cell = lib.top_level()[0]
    gds_bbox = top_cell.bounding_box()
    gds_min_x, gds_min_y = gds_bbox[0]
    gds_max_x, gds_max_y = gds_bbox[1]

    mesh_min_x = min(m.bounds[0, 0] for m in meshes.values())
    mesh_max_x = max(m.bounds[1, 0] for m in meshes.values())
    mesh_min_y = min(m.bounds[0, 1] for m in meshes.values())
    mesh_max_y = max(m.bounds[1, 1] for m in meshes.values())

    assert mesh_min_x == pytest.approx(gds_min_x, abs=1e-3)
    assert mesh_max_x == pytest.approx(gds_max_x, abs=1e-3)
    assert mesh_min_y == pytest.approx(gds_min_y, abs=1e-3)
    assert mesh_max_y == pytest.approx(gds_max_y, abs=1e-3)

    # 3. Z extents match stack.yaml per layer and overall
    for layer in stack:
        mesh = meshes[layer.name]
        layer_z_min = mesh.bounds[0, 2]
        layer_z_max = mesh.bounds[1, 2]
        assert layer_z_min == pytest.approx(layer.z, abs=1e-3)
        assert layer_z_max == pytest.approx(layer.z + layer.thickness, abs=1e-3)

    overall_z_min = min(m.bounds[0, 2] for m in meshes.values())
    overall_z_max = max(m.bounds[1, 2] for m in meshes.values())
    assert overall_z_min == pytest.approx(stack[0].z, abs=1e-3)
    assert overall_z_max == pytest.approx(stack[-1].z + stack[-1].thickness, abs=1e-3)
