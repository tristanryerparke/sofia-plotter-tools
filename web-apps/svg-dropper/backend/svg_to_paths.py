import io
import numpy as np
import vpype as vp
from lxml import etree


def strip_svg_units(svg_data: str) -> str:
    """Removes width and height attributes"""
    root = etree.fromstring(svg_data.encode("utf-8"))

    for attr in ["width", "height"]:
        if attr in root.attrib:
            del root.attrib[attr]

    return etree.tostring(root, pretty_print=True, encoding="unicode")


def svg_string_to_paths(svg_string):
    # Create a StringIO object from the SVG string
    svg_io = io.StringIO(strip_svg_units(svg_string))

    # Read SVG from the StringIO object
    line_collection, _, _ = vp.read_svg(svg_io, quantization=0.1, simplify=True)

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


if __name__ == "__main__":
    import matplotlib.pyplot as plt

    # Read the SVG file
    with open("web-apps/svg-dropper/backend/tests/insta_full copy.svg", "r") as f:
        svg_string = f.read()

    # Convert SVG string to paths
    paths = svg_string_to_paths(svg_string)

    for path in paths:
        plt.plot(path[:, 0], path[:, 1])
    plt.show()
