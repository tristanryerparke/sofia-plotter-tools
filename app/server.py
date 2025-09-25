from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import base64
import numpy as np
import traceback
from svgpathtools import svg2paths2, paths2Drawing
from io import StringIO
from devtools import debug as d

from app.utils import create_gcode, extract_viewbox, truncate_decimals, strip_svg_units
from app.gcode_sender import send_gcode, set_gcode_data
from app.vpype_convert import process_svg_string_to_json


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to load functions and types from the provided path argument"""
    print("Starting Sofia Plotter")
    yield


# Create the FastAPI app
app = FastAPI(
    title="Sofia Plotter",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


class SVGParams(BaseModel):
    width: float
    height: float
    outputFile: str
    polylineTolerance: float
    clearance: float
    optimize: bool
    feedrate: int
    flipVertically: bool
    flipHorizontally: bool


class SVGData(BaseModel):
    svg_base64: str
    params: SVGParams


class SendGCodeRequest(BaseModel):
    hostname: str


@app.post("/send-gcode")
async def send_gcode_endpoint(request: SendGCodeRequest):
    return await send_gcode(request.hostname)


@app.post("/process-svg")
async def process_svg(data: SVGData):
    try:
        svg_data = base64.b64decode(data.svg_base64).decode("utf-8")

        # print("SVG DATA:")
        # print(f"svg_data[:200]: {svg_data[:400]}")
        # print()

        # Save original SVG for debugging
        with open("test_save.svg", "w") as f:
            f.write(svg_data)

        # Extract viewbox information
        vb_min_x, vb_min_y, vb_width, vb_height = extract_viewbox(svg_data)
        print(f"vb_min_x: {vb_min_x}, vb_min_y: {vb_min_y}, vb_width: {vb_width}, vb_height: {vb_height}")

        svg_data_stripped = strip_svg_units(svg_data)
        paths_nested_list = process_svg_string_to_json(
            svg_data_stripped,
            single_layer=True,
            tolerance=data.params.polylineTolerance,
            optimize=data.params.optimize,
        )

        # # Total number of paths/polylines across all layers
        # total_paths = sum(len(layer) for layer in paths_nested_list)
        # print(f"Total number of paths/polylines across all layers: {total_paths}")

        # Currently grabs only the first layer
        paths_numpy_array = [np.array(path) for path in paths_nested_list[0]]

        # Calculate scaling factors
        scale_x = data.params.width / vb_width
        scale_y = data.params.height / vb_height

        print(f"data.params.width: {data.params.width}, data.params.height: {data.params.height}")
        print(f"scale_x: {scale_x}, scale_y: {scale_y}")

        # Scale the paths
        scaled_paths = []
        for path in paths_numpy_array:
            scaled_path = np.zeros_like(path)
            scaled_path[:, 0] = (path[:, 0] - vb_min_x) * scale_x
            scaled_path[:, 1] = (path[:, 1] - vb_min_y) * scale_y
            scaled_paths.append(scaled_path)

        # Apply flipping if needed
        if data.params.flipVertically:
            for path in scaled_paths:
                path[:, 1] = data.params.height - path[:, 1]

        if data.params.flipHorizontally:
            for path in scaled_paths:
                path[:, 0] = data.params.width - path[:, 0]

        # Generate G-code from paths
        gcode, regular_moves, travel_moves, total_length = create_gcode(
            scaled_paths, z_lift=data.params.clearance, size=(data.params.width, data.params.height), feedrate=data.params.feedrate, optimize=data.params.optimize
        )

        # print(f"GCODE LENGTH: {len(gcode)}\n")
        # print(f"FIRST 100 CHARACTERS: {gcode[:100]}\n")
        # print(f"LAST 100 CHARACTERS: {gcode[-100:]}\n")

        # Set the GCODE data for sending
        set_gcode_data(gcode, data.params.outputFile)

        # Encode gcode as base64
        gcode_base64 = base64.b64encode(gcode.encode()).decode()

        return {
            "message": "SVG processed successfully",
            "gcode": gcode_base64,
            "plotData": {
                "regularMoves": truncate_decimals(regular_moves),
                "travelMoves": truncate_decimals(travel_moves),
                "totalLength": total_length,
            },
        }
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
