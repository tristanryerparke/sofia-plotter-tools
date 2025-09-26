import numpy as np
import json
from typing import Tuple
import xml.etree.ElementTree as ET
import re
from lxml import etree
import vpype as vp
import io

DEFAULT_PRECISION = 2


def fg(number, precision=DEFAULT_PRECISION):
    """formats a number for gcode output"""
    if number == 0:  # Handle zero separately
        return "0"
    elif number % 1 == 0:  # Check if the number is an integer
        return str(int(number))  # Convert to string and return
    elif 0 < abs(number) < 1:  # Check if the absolute value is less than 1
        # Format with a leading zero, specify precision, and remove trailing zeros
        return f"{number:0.{precision}f}".rstrip("0").rstrip(".")
    else:
        # Format normally, specify precision, and remove trailing zeros
        return f"{number:.{precision}f}".rstrip("0").rstrip(".")


def truncate_decimals(data, decimal_places=3):
    """Truncate all floating point numbers in a nested list structure to a specified number of decimal places."""
    # Convert to JSON
    json_str = json.dumps(data)

    # Use regex to find floating point numbers
    pattern = r"\d+\.\d+"

    def truncate(match):
        number = float(match.group())
        truncated = f"{number:.{decimal_places}f}"
        # Remove trailing zeros and decimal point if it becomes an integer
        return re.sub(r"\.?0+$", "", truncated)

    truncated_json = re.sub(pattern, truncate, json_str)

    return truncated_json


def extract_viewbox(svg_data: str, default_width: float = 100, default_height: float = 100) -> Tuple[float, float, float, float]:
    """Extracts the viewBox attribute from the SVG data and returns it as a tuple of four floats"""
    root = ET.fromstring(svg_data)
    viewbox = root.attrib.get("viewBox")

    if viewbox:
        return tuple(map(float, re.split("[ ,]+", viewbox)))
    else:
        return 0, 0, default_width, default_height


def strip_svg_units(svg_data: str) -> str:
    """Removes width and height attributes"""
    root = etree.fromstring(svg_data.encode("utf-8"))

    for attr in ["width", "height"]:
        if attr in root.attrib:
            del root.attrib[attr]

    return etree.tostring(root, pretty_print=True, encoding="unicode")


def vpype_svg_to_paths(svg_string, tolerance=0.1):
    # Create a StringIO object from the SVG string
    svg_io = io.StringIO(strip_svg_units(svg_string))

    # Read SVG from the StringIO object
    line_collection, _, _ = vp.read_svg(svg_io, quantization=tolerance, simplify=True)

    # Create document and add the line collection
    doc = vp.Document()
    doc.add(line_collection, layer_id=1)

    bounds = doc.bounds()
    if bounds:
        center_y = 0.5 * (bounds[1] + bounds[3])
        doc.translate(0, -center_y)
        doc.scale(1, -1)
        doc.translate(0, center_y)

    # Create a list to store all paths
    paths = []

    # Get the layer we just created (layer_id=1)
    layer = doc.layers[1]

    # Process each line in the layer
    for line in layer:
        # Create numpy array for the current path
        path_points = np.zeros((len(line), 2))

        # Process each point in the line
        for i, point in enumerate(line):
            x, y = point.real, point.imag
            path_points[i] = [x, y]

        # Add the path to our list
        paths.append(path_points)

    return paths


def optimize_path_order(paths):
    """
    Optimize the order of paths using a nearest neighbor heuristic to minimize travel distance.
    This is a greedy approximation to the traveling salesman problem.

    Args:
        paths: List of numpy arrays representing stroke paths

    Returns:
        List of paths in optimized order
    """
    if len(paths) <= 1:
        return paths

    # Convert to numpy arrays if not already
    paths = [np.array(path) if not isinstance(path, np.ndarray) else path for path in paths]

    # Extract start and end points for each path
    start_points = np.array([path[0] for path in paths])
    end_points = np.array([path[-1] for path in paths])

    # Track which paths we've used
    unused_indices = list(range(len(paths)))
    optimized_paths = []

    # Start with the path closest to origin (0,0)
    origin = np.array([0, 0])
    distances_to_origin = np.linalg.norm(start_points, axis=1)
    current_idx = np.argmin(distances_to_origin)

    # Current position is the end of the first path
    current_pos = end_points[current_idx]
    optimized_paths.append(paths[current_idx])
    unused_indices.remove(current_idx)

    # Greedily select the nearest path
    while unused_indices:
        remaining_start_points = start_points[unused_indices]
        remaining_end_points = end_points[unused_indices]

        # Calculate distances from current position to start of each remaining path
        distances_to_starts = np.linalg.norm(remaining_start_points - current_pos, axis=1)

        # Also consider distances to end points (in case we want to reverse the path)
        distances_to_ends = np.linalg.norm(remaining_end_points - current_pos, axis=1)

        # Choose the closest point (either start or end of a path)
        min_start_dist = np.min(distances_to_starts)
        min_end_dist = np.min(distances_to_ends)

        if min_start_dist <= min_end_dist:
            # Use path in normal direction
            next_local_idx = np.argmin(distances_to_starts)
            next_global_idx = unused_indices[next_local_idx]
            next_path = paths[next_global_idx]
            current_pos = end_points[next_global_idx]
        else:
            # Use path in reverse direction
            next_local_idx = np.argmin(distances_to_ends)
            next_global_idx = unused_indices[next_local_idx]
            next_path = paths[next_global_idx][::-1]  # Reverse the path
            current_pos = start_points[next_global_idx]

        optimized_paths.append(next_path)
        unused_indices.remove(next_global_idx)

    return optimized_paths


def create_gcode(strokes, z_lift, size, feedrate=10000, optimize=False):
    # Debug: Check input data structure
    print(f"create_gcode received {len(strokes)} strokes")
    if len(strokes) > 0:
        print(f"First stroke type: {type(strokes[0])}")
        if hasattr(strokes[0], "shape"):
            print(f"First stroke shape: {strokes[0].shape}")
        else:
            print(f"First stroke length: {len(strokes[0])}")
        print(f"First stroke sample: {strokes[0][:3] if len(strokes[0]) > 3 else strokes[0]}")

    def process_path(new_path):
        nonlocal last_point, total_length
        if len(new_path) > 1:
            new_path = np.array(new_path)
            gcodefile.append(f"G1 Z{fg(z_lift)}")
            gcodefile.append(f"G0 X{fg(new_path[0][0])} Y{fg(new_path[0][1])}")

            if last_point is not None:
                travel_moves.append([last_point, new_path[0].tolist()])
                total_length += np.linalg.norm(np.array(last_point) - np.array(new_path[0]))

            for i in range(0, len(new_path)):
                pt1 = new_path[i - 1]
                pt2 = new_path[i]
                gcodefile.append(f"G1 X{fg(pt2[0])} Y{fg(pt2[1])} Z0")
                total_length += np.linalg.norm(pt2 - pt1)

            paths_out.append(new_path)
            regular_moves.append(new_path.tolist())

            last_point = new_path[-1].tolist()

    gcodefile = ["G21", f"G1 F{feedrate}", "G53 G0 Z-20"]

    paths_out = []
    regular_moves = []
    travel_moves = []
    last_point = None
    total_length = 0.0

    def point_in_bounds(pt):
        return 0 <= pt[0] <= size[0] and 0 <= pt[1] <= size[1]

    # First, filter all paths to only include in-bounds segments
    filtered_paths = []
    for path in strokes:
        # Ensure path is a numpy array for consistent handling
        path_array = np.array(path) if not isinstance(path, np.ndarray) else path
        current_path = []
        for pt in path_array:
            if point_in_bounds(pt):
                current_path.append(pt)
            else:
                if current_path:
                    filtered_paths.append(np.array(current_path))
                    current_path = []
        if current_path:
            filtered_paths.append(np.array(current_path))

    # Apply optimization if requested
    if optimize and len(filtered_paths) > 1:
        print(f"Optimizing {len(filtered_paths)} paths for minimal travel distance...")
        filtered_paths = optimize_path_order(filtered_paths)
        print("Path optimization complete.")

    # Process all paths in the (potentially optimized) order
    for i, path in enumerate(filtered_paths):
        if i == 0:
            gcodefile.append(f"G0 X{fg(path[0][0])} Y{fg(path[0][1])}")
        process_path(path)

    gcodefile.append(f"G1 Z{z_lift:.2f}")

    gcode_all = "\n".join(gcodefile)
    return gcode_all, regular_moves, travel_moves, total_length
