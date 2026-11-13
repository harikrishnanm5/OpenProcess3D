# SkyWater 130nm PDK Reference

Layer stack and process definitions for the SkyWater SKY130 open-source PDK.

## Overview

The layer stack definition in `stack.yaml` defines the physical and schematic properties of fabrication layers for SkyWater 130nm process geometry extrusion.

> **Note on Vertical Coordinates (z):**
> There are no explicit absolute vertical position ($z$) values in the SkyWater documentation tables. The $z$ positions in `stack.yaml` are schematic (derived from fabrication sequence order, stacked with no vertical gaps: $z_{i+1} = z_i + t_i$), not measured from the SkyWater physical stack figure. Every layer's $z$ coordinate is therefore designated `approx: true`.
>
> All other GDS layers not defined in `stack.yaml` are left unmapped; warnings during extrusion are expected.

## Layer Citations

- **`nwell` (64, 20)**: SkyWater SKY130 docs, rules/assumptions "Criteria & Assumptions", Junction Depths table (parameter `NWVDIM`: $t = 1.1\,\mu\text{m}$, junction depth, marked `approx: true`); GDS from rules/layers "Layers Reference" (64, 20).
- **`diff` (65, 20)**: SkyWater SKY130 docs, rules/assumptions "Criteria & Assumptions", Junction Depths table (parameter `JCTD`: $t = 0.1\,\mu\text{m}$, S/D junction depth, marked `approx: true`); GDS from rules/layers "Layers Reference" (65, 20).
- **`poly` (66, 20)**: SkyWater SKY130 docs, rules/assumptions "Criteria & Assumptions", Material Thicknesses table (parameter `POLYTH`: $t = 0.18\,\mu\text{m}$); GDS from rules/layers "Layers Reference" (66, 20); $z$ is schematic (`approx: true`).
- **`licon1` (66, 44)**: GDS from SkyWater SKY130 rules/layers "Layers Reference" (66, 44); thickness ($t = 0.2\,\mu\text{m}$) and $z$ are schematic/illustrative (no source value in tables, marked `approx: true`).
- **`li1` (67, 20)**: SkyWater SKY130 docs, rules/assumptions "Criteria & Assumptions", Material Thicknesses table (parameter `LiThick`: $t = 0.1\,\mu\text{m}$, "for antenna ratio calculations"); GDS from rules/layers "Layers Reference" (67, 20); $z$ is schematic (`approx: true`).
- **`mcon` (67, 44)**: GDS from SkyWater SKY130 rules/layers "Layers Reference" (67, 44); thickness ($t = 0.2\,\mu\text{m}$) and $z$ are schematic/illustrative (no source value in tables, marked `approx: true`).
- **`met1` (68, 20)**: SkyWater SKY130 docs, rules/assumptions "Criteria & Assumptions", Material Thicknesses table (parameter `Met1Thick`: $t = 0.35\,\mu\text{m}$, "for antenna ratio calculations"); GDS from rules/layers "Layers Reference" (68, 20); $z$ is schematic (`approx: true`).
