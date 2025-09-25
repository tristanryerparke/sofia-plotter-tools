from pathlib import Path
import vpype as vp
import vpype_cli
import json
import tempfile
import numpy as np


def process_svg_string_to_json(
    svg_string: str,
    config_file: str = "plot.toml",
    single_layer: bool = False,
    tolerance: float = 0.05,
    optimize: bool = False,
) -> list:
    """
    Process an SVG string and return JSON object using vpype programmatically.

    Args:
        svg_string: SVG content as string
        config_file: Path to vpype config file (optional)

    Returns:
        list: List of layers, where each layer contains a list of paths, and each path contains a list of [x, y] points
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
        # Build the pipeline using temporary file paths
        pipeline = f'read {"-m" if single_layer else ""} "{temp_svg_path}" {"linesort" if optimize else ""} linesimplify -t {tolerance} gwrite --profile json_t "{temp_json_path}"'
        print(f"pipeline: {pipeline}")
        # Execute the pipeline
        result_document = vpype_cli.execute(pipeline)

        # Read the generated JSON file
        with open(temp_json_path, "r") as f:
            json_result = json.load(f)

        # print(f"Successfully processed {len(result_document.layers)} layers")

        return json_result

    finally:
        # Clean up temporary files
        Path(temp_svg_path).unlink(missing_ok=True)
        Path(temp_json_path).unlink(missing_ok=True)


if __name__ == "__main__":
    with open("example-files/curves-final-SM1.svg", "r") as f:
        svg_string = f.read()

    json_result = process_svg_string_to_json(svg_string, config_file="plot.toml", single_layer=False)

    print(f"parent list length: {len(json_result)}\n")

    print("child list lengths:")
    child_list_lengths = [len(item) for item in json_result]
    print(child_list_lengths)

    # Total number of paths/polylines across all layers
    total_paths = sum(len(layer) for layer in json_result)
    print(f"Total number of paths/polylines across all layers: {total_paths}")

    print("sample child list:")
    print(json_result[0][0])

    # Convert to numpy arrays for detailed debugging (matching server.py style)
    paths_numpy_array = [np.array(path) for path in json_result[0]]

    # Debug: Check data types and structure
    print(f"Number of paths: {len(paths_numpy_array)}")
    if len(paths_numpy_array) > 0:
        print(f"First path type: {type(paths_numpy_array[0])}")
        print(f"First path shape: {paths_numpy_array[0].shape}")
        print(f"First path sample: {paths_numpy_array[0]}")  # First 3 points
    print(f"All path shapes: {[path.shape for path in paths_numpy_array[:5]]}")  # First 5 paths
