#!/usr/bin/env python3
"""
Standalone SVG Layer Extractor
Extracts layers from SVG files and returns them as a dictionary.

This module provides a reusable function to split SVG files into separate layers,
with each layer containing its constituent paths as coordinate arrays.
"""

from pathlib import Path
import vpype as vp
import vpype_cli
import json
import tempfile
from typing import Dict, List, Tuple, Optional
import numpy as np


def extract_svg_layers(
    svg_string: str,
    tolerance: float = 0.05,
    optimize: bool = False,
    config_file: Optional[str] = None,
    return_numpy: bool = False,
) -> Dict[int, List]:
    """
    Extract all layers from an SVG string and return as a dictionary.

    Args:
        svg_string: SVG content as string
        tolerance: Polyline simplification tolerance (default: 0.05)
        optimize: Whether to optimize path order within layers (default: False)
        config_file: Path to vpype config file (optional)
        return_numpy: If True, returns numpy arrays; if False, returns lists (default: False)

    Returns:
        Dict[int, List]: Dictionary where keys are layer IDs (1-indexed) and values are
                        lists of paths. Each path is either a list or numpy array of [x, y] points.

    Example:
        >>> svg_content = open('example.svg').read()
        >>> layers = extract_svg_layers(svg_content)
        >>> print(f"Found {len(layers)} layers")
        >>> for layer_id, paths in layers.items():
        ...     print(f"Layer {layer_id}: {len(paths)} paths")
    """

    # Load the config file if provided
    if config_file and Path(config_file).exists():
        vp.config_manager.load_config_file(config_file)

    # Create temporary files for input SVG and output JSON
    with tempfile.NamedTemporaryFile(mode="w", suffix=".svg", delete=False) as temp_svg:
        temp_svg.write(svg_string)
        temp_svg_path = temp_svg.name

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as temp_json:
        temp_json_path = temp_json.name

    try:
        # Build the pipeline - NOTE: No -m flag means layers are preserved
        pipeline_parts = [
            f'read "{temp_svg_path}"',
            'linesort' if optimize else '',
            f'linesimplify -t {tolerance}',
            f'gwrite --profile json_t "{temp_json_path}"'
        ]
        pipeline = ' '.join(part for part in pipeline_parts if part)

        # Execute the pipeline
        result_document = vpype_cli.execute(pipeline)

        # Read the generated JSON file
        with open(temp_json_path, "r") as f:
            json_result = json.load(f)

        # Convert to dictionary format with layer IDs as keys
        layers_dict = {}

        if isinstance(json_result, list):
            # json_result is a list of layers
            for layer_idx, layer_paths in enumerate(json_result):
                layer_id = layer_idx + 1  # 1-indexed layer IDs

                if return_numpy:
                    # Convert to numpy arrays
                    layers_dict[layer_id] = [np.array(path) for path in layer_paths]
                else:
                    # Keep as lists
                    layers_dict[layer_id] = layer_paths

        return layers_dict

    finally:
        # Clean up temporary files
        Path(temp_svg_path).unlink(missing_ok=True)
        Path(temp_json_path).unlink(missing_ok=True)


def extract_svg_layers_with_metadata(
    svg_string: str,
    tolerance: float = 0.05,
    optimize: bool = False,
    config_file: Optional[str] = None,
) -> Dict[int, Dict]:
    """
    Extract layers with additional metadata (path count, bounds, etc.).

    Args:
        svg_string: SVG content as string
        tolerance: Polyline simplification tolerance (default: 0.05)
        optimize: Whether to optimize path order within layers (default: False)
        config_file: Path to vpype config file (optional)

    Returns:
        Dict[int, Dict]: Dictionary where keys are layer IDs and values are dicts containing:
            - 'paths': List of paths (each path is a list of [x, y] points)
            - 'path_count': Number of paths in the layer
            - 'bounds': Bounding box as (min_x, min_y, max_x, max_y)
            - 'total_points': Total number of points across all paths

    Example:
        >>> layers = extract_svg_layers_with_metadata(svg_content)
        >>> for layer_id, info in layers.items():
        ...     print(f"Layer {layer_id}: {info['path_count']} paths, {info['total_points']} points")
        ...     print(f"  Bounds: {info['bounds']}")
    """

    layers = extract_svg_layers(svg_string, tolerance, optimize, config_file, return_numpy=True)

    layers_with_metadata = {}

    for layer_id, paths in layers.items():
        # Calculate metadata
        path_count = len(paths)
        total_points = sum(len(path) for path in paths)

        # Calculate bounds
        if paths and len(paths) > 0:
            all_points = np.vstack(paths)
            min_x, min_y = all_points.min(axis=0)
            max_x, max_y = all_points.max(axis=0)
            bounds = (float(min_x), float(min_y), float(max_x), float(max_y))
        else:
            bounds = (0, 0, 0, 0)

        layers_with_metadata[layer_id] = {
            'paths': [path.tolist() for path in paths],  # Convert back to lists for JSON serialization
            'path_count': path_count,
            'total_points': total_points,
            'bounds': bounds,
        }

    return layers_with_metadata


def merge_layers(
    layers_dict: Dict[int, List],
    layer_ids: Optional[List[int]] = None
) -> List:
    """
    Merge multiple layers into a single list of paths.

    Args:
        layers_dict: Dictionary of layers (output from extract_svg_layers)
        layer_ids: List of layer IDs to merge. If None, merges all layers.

    Returns:
        List: Combined list of all paths from selected layers

    Example:
        >>> layers = extract_svg_layers(svg_content)
        >>> # Merge only layers 1 and 3
        >>> combined = merge_layers(layers, [1, 3])
        >>> # Merge all layers
        >>> all_paths = merge_layers(layers)
    """
    if layer_ids is None:
        layer_ids = list(layers_dict.keys())

    merged_paths = []
    for layer_id in layer_ids:
        if layer_id in layers_dict:
            merged_paths.extend(layers_dict[layer_id])

    return merged_paths


if __name__ == "__main__":
    # Example usage
    import sys

    if len(sys.argv) > 1:
        svg_file = sys.argv[1]
    else:
        svg_file = "example-files/curves-final-SM1.svg"

    if not Path(svg_file).exists():
        print(f"Error: File '{svg_file}' not found")
        sys.exit(1)

    # Read SVG file
    with open(svg_file, "r") as f:
        svg_content = f.read()

    print(f"Processing: {svg_file}\n")

    # Extract layers
    layers = extract_svg_layers(svg_content, tolerance=0.05)

    print(f"Found {len(layers)} layer(s)\n")

    for layer_id, paths in layers.items():
        total_points = sum(len(path) for path in paths)
        print(f"Layer {layer_id}:")
        print(f"  - {len(paths)} path(s)")
        print(f"  - {total_points} total points")

    print("\n" + "="*60 + "\n")

    # Extract layers with metadata
    layers_meta = extract_svg_layers_with_metadata(svg_content)

    print("Detailed layer information:\n")

    for layer_id, info in layers_meta.items():
        print(f"Layer {layer_id}:")
        print(f"  - Paths: {info['path_count']}")
        print(f"  - Points: {info['total_points']}")
        print(f"  - Bounds: ({info['bounds'][0]:.2f}, {info['bounds'][1]:.2f}) to ({info['bounds'][2]:.2f}, {info['bounds'][3]:.2f})")

    print("\n" + "="*60 + "\n")

    # Example: Merge all layers
    all_paths = merge_layers(layers)
    print(f"Merged all layers: {len(all_paths)} total paths")
