#!/usr/bin/env python3
"""
Example script showing how to use vpype programmatically without command line.
This processes SVG strings and returns JSON objects without saving to disk.
"""

import json
import tempfile
import vpype as vp
import vpype_cli
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np


def process_svg_string_to_json(svg_string: str, config_file: str = "plot.toml") -> list:
    """
    Process an SVG string and return JSON object using vpype programmatically.

    Args:
        svg_string: SVG content as string
        config_file: Path to vpype config file (optional)

    Returns:
        dict: JSON object containing the processed path data
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
        pipeline = f'read -m "{temp_svg_path}" gwrite --profile json_t "{temp_json_path}"'

        # Execute the pipeline
        result_document = vpype_cli.execute(pipeline)

        # Read the generated JSON file
        with open(temp_json_path, "r") as f:
            json_result = json.load(f)

        print(f"Successfully processed {len(result_document.layers)} layers")

        return json_result

    finally:
        # Clean up temporary files
        Path(temp_svg_path).unlink(missing_ok=True)
        Path(temp_json_path).unlink(missing_ok=True)


def plot_coordinate_groups(coordinate_groups: list, title: str = "SVG Path Visualization"):
    """
    Plot groups of XY coordinates using matplotlib.

    Args:
        coordinate_groups: List of coordinate groups, where each group is a list of [x, y] pairs
        title: Title for the plot
    """
    plt.figure(figsize=(12, 8))

    # Generate different colors for each group
    colors = plt.cm.tab10(np.linspace(0, 1, len(coordinate_groups)))

    for i, group in enumerate(coordinate_groups):
        if len(group) > 0:
            # Extract x and y coordinates
            x_coords = [point[0] for point in group]
            y_coords = [point[1] for point in group]

            # Plot the path
            plt.plot(x_coords, y_coords, color=colors[i], linewidth=1.5, alpha=0.8, label=f"Group {i + 1} ({len(group)} points)")

            # Mark start and end points
            if len(group) > 1:
                plt.scatter(x_coords[0], y_coords[0], color=colors[i], s=50, marker="o", alpha=0.9, zorder=5)
                plt.scatter(x_coords[-1], y_coords[-1], color=colors[i], s=50, marker="s", alpha=0.9, zorder=5)

    plt.title(title)
    plt.xlabel("X Coordinate")
    plt.ylabel("Y Coordinate")
    plt.grid(True, alpha=0.3)
    plt.axis("equal")  # Equal aspect ratio
    plt.legend(bbox_to_anchor=(1.05, 1), loc="upper left")
    plt.tight_layout()

    # Invert y-axis to match SVG coordinate system (origin at top-left)
    plt.gca().invert_yaxis()

    plt.show()

    print(f"Plotted {len(coordinate_groups)} coordinate groups")
    for i, group in enumerate(coordinate_groups):
        print(f"  Group {i + 1}: {len(group)} points")


if __name__ == "__main__":
    # Example usage - read an SVG file and process it
    svg_file = "example-files/curves-final-SM1.svg"
    config_file = "plot.toml"

    # Read the SVG file as a string
    with open(svg_file, "r") as f:
        svg_content = f.read()

    # Process the SVG string and get JSON result
    json_result = process_svg_string_to_json(svg_content, config_file)

    # Print some information about the result
    print(f"Result type: {type(json_result)}")
    if isinstance(json_result, dict):
        print(f"JSON keys: {list(json_result.keys())}")

    # Plot the coordinate groups if the result is a list of coordinate groups
    if isinstance(json_result, list) and len(json_result) > 0:
        # Check if it's a list of coordinate groups (list of lists of [x, y] pairs)
        if all(isinstance(group, list) for group in json_result):
            plot_coordinate_groups(json_result, f"Visualization of {svg_file}")
        else:
            print("JSON result is not in the expected format for plotting")
    else:
        print("No coordinate groups found to plot")
