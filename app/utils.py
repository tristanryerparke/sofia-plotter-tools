import numpy as np
import json
from typing import Tuple
import xml.etree.ElementTree as ET
import re
from lxml import etree
import io
import vpype as vp


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


def svg_string_to_paths(svg_string, tolerance=0.1):
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


def create_gcode(strokes, z_lift, size, feedrate=10000):
    def process_path(new_path):
        nonlocal last_point, total_length
        if len(new_path) > 1:
            new_path = np.array(new_path)
            gcodefile.append(f"G1 Z{z_lift:.2f}")
            gcodefile.append(f"G0 X{new_path[0][0]:.2f} Y{new_path[0][1]:.2f}")

            if last_point is not None:
                travel_moves.append([last_point, new_path[0].tolist()])
                total_length += np.linalg.norm(np.array(last_point) - np.array(new_path[0]))

            for i in range(0, len(new_path)):
                pt1 = new_path[i - 1]
                pt2 = new_path[i]
                gcodefile.append(f"G1 X{pt2[0]:.2f} Y{pt2[1]:.2f} Z0")
                total_length += np.linalg.norm(pt2 - pt1)

            paths_out.append(new_path)
            regular_moves.append(new_path.tolist())

            last_point = new_path[-1].tolist()

    gcodefile = ["G21", f"G1 F{feedrate}"]

    paths_out = []
    regular_moves = []
    travel_moves = []
    last_point = None
    total_length = 0.0

    def point_in_bounds(pt):
        return 0 <= pt[0] <= size[0] and 0 <= pt[1] <= size[1]

    for path in strokes:
        current_path = []
        for pt in path:
            if point_in_bounds(pt):
                current_path.append(pt)
            else:
                if current_path:
                    process_path(current_path)
                    current_path = []
        if current_path:
            process_path(current_path)

    gcodefile.append(f"G1 Z{z_lift:.2f}")

    gcode_all = "\n".join(gcodefile)
    return gcode_all, regular_moves, travel_moves, total_length
