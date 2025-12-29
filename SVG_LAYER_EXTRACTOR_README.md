# SVG Layer Extractor

A standalone Python module for extracting layers from SVG files into a dictionary format.

## Installation

The module requires the following dependencies (already in `pyproject.toml`):
- `vpype >= 1.15.0`
- `numpy >= 2.3.2`

## Usage

### Basic Usage

```python
from svg_layer_extractor import extract_svg_layers

# Read your SVG file
with open('my_drawing.svg', 'r') as f:
    svg_content = f.read()

# Extract all layers as a dictionary
layers = extract_svg_layers(svg_content)

# Result: {1: [path1, path2, ...], 2: [path3, path4, ...], ...}
for layer_id, paths in layers.items():
    print(f"Layer {layer_id}: {len(paths)} paths")
    for path in paths:
        print(f"  Path with {len(path)} points")
```

### With NumPy Arrays

```python
# Get paths as NumPy arrays instead of lists
layers = extract_svg_layers(svg_content, return_numpy=True)

# Now you can use NumPy operations
for layer_id, paths in layers.items():
    for path in paths:
        # path is now a numpy array with shape (n_points, 2)
        print(f"Path shape: {path.shape}")
        print(f"First point: {path[0]}")
```

### With Metadata

```python
from svg_layer_extractor import extract_svg_layers_with_metadata

# Get layers with additional information
layers_info = extract_svg_layers_with_metadata(svg_content)

for layer_id, info in layers_info.items():
    print(f"Layer {layer_id}:")
    print(f"  Paths: {info['path_count']}")
    print(f"  Points: {info['total_points']}")
    print(f"  Bounds: {info['bounds']}")  # (min_x, min_y, max_x, max_y)
```

### Merge Layers

```python
from svg_layer_extractor import extract_svg_layers, merge_layers

layers = extract_svg_layers(svg_content)

# Merge all layers into one list of paths
all_paths = merge_layers(layers)

# Merge only specific layers
selected_paths = merge_layers(layers, layer_ids=[1, 3, 5])
```

### Advanced Options

```python
layers = extract_svg_layers(
    svg_content,
    tolerance=0.1,           # Polyline simplification tolerance (higher = fewer points)
    optimize=True,           # Optimize path order to minimize travel distance
    config_file='plot.toml', # Optional vpype config file
    return_numpy=True        # Return NumPy arrays instead of lists
)
```

## Function Reference

### `extract_svg_layers(svg_string, ...)`

Extracts all layers from an SVG string.

**Parameters:**
- `svg_string` (str): SVG content as a string
- `tolerance` (float): Polyline simplification tolerance (default: 0.05)
- `optimize` (bool): Optimize path order within layers (default: False)
- `config_file` (str): Path to vpype config file (optional)
- `return_numpy` (bool): Return NumPy arrays if True, lists if False (default: False)

**Returns:**
- `Dict[int, List]`: Dictionary where keys are layer IDs (1-indexed) and values are lists of paths

### `extract_svg_layers_with_metadata(svg_string, ...)`

Extracts layers with additional metadata.

**Parameters:** Same as `extract_svg_layers` (except `return_numpy`)

**Returns:**
- `Dict[int, Dict]`: Dictionary with layer metadata including:
  - `'paths'`: List of paths
  - `'path_count'`: Number of paths
  - `'total_points'`: Total points across all paths
  - `'bounds'`: Bounding box (min_x, min_y, max_x, max_y)

### `merge_layers(layers_dict, layer_ids=None)`

Merges multiple layers into a single list of paths.

**Parameters:**
- `layers_dict` (Dict): Output from `extract_svg_layers`
- `layer_ids` (List[int]): Layer IDs to merge (merges all if None)

**Returns:**
- `List`: Combined list of paths

## Command Line Usage

```bash
# Run with default example file
python svg_layer_extractor.py

# Run with your own SVG file
python svg_layer_extractor.py path/to/your/file.svg
```

## Output Format

Each path is represented as a list (or NumPy array) of `[x, y]` coordinate pairs:

```python
{
    1: [  # Layer 1
        [[x1, y1], [x2, y2], [x3, y3], ...],  # Path 1
        [[x1, y1], [x2, y2], ...],             # Path 2
    ],
    2: [  # Layer 2
        [[x1, y1], [x2, y2], ...],             # Path 1
    ],
}
```

## Integration with Existing Code

To use this in your existing `server.py` instead of the current implementation:

```python
from svg_layer_extractor import extract_svg_layers, merge_layers

# In your process_svg endpoint:
layers = extract_svg_layers(
    svg_data_stripped,
    tolerance=data.params.polylineTolerance,
    optimize=data.params.optimize,
    return_numpy=True
)

# Use all layers merged
all_paths = merge_layers(layers)

# Or use a specific layer
paths_numpy_array = layers[1]  # First layer only
```

## Notes

- Layer IDs start at 1 (not 0)
- Empty layers are not included in the output dictionary
- The function uses `vpype` internally for robust SVG parsing
- Temporary files are automatically cleaned up after processing
