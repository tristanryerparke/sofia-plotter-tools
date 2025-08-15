from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import base64
import os
import numpy as np
import requests
import re
import traceback
from svgpathtools import svg2paths2, paths2Drawing
from io import StringIO

from app.utils import create_gcode, extract_viewbox, truncate_decimals, svg_string_to_paths


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

current_gcode_text = ""
filename = ""


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


@app.post("/send-gcode")
async def send_gcode():
    global current_gcode_text
    global filename

    if os.getenv("VITE_SVG2G_IS_PROD") == "False":
        ip = "sofia-mini-plotter.local"
    else:
        ip = "localhost"

    conn_res = requests.get(f"http://{ip}/machine/connect")
    session_key = conn_res.json()["sessionKey"]

    while True:
        # check if file exists
        file_exists_res = requests.get(
            f"http://{ip}/machine/fileinfo/gcodes/{filename}.gcode",
            headers={"X-Session-Key": session_key},
        )

        try:
            file_exists_res.json()
        except:
            break

        if file_exists_res.status_code == 200:
            print("File exists")
            match = re.match(r"^(.*?)(\((\d+)\))?$", filename.split(".")[0])
            if match:
                base, _, num = match.groups()
                num = int(num) + 1 if num else 2
                filename = f"{base}({num})"
            print(f"New filename: {filename}")

    print(current_gcode_text[:100])

    conn_res = requests.put(
        f"http://{ip}/machine/file/gcodes/{filename}.gcode",
        current_gcode_text,
        headers={"X-Session-Key": session_key},
    )
    print(conn_res.status_code)
    print(conn_res.text)

    if conn_res.status_code != 201:
        raise HTTPException(status_code=500, detail="Failed to send GCODE to plotter")


@app.post("/process-svg")
async def process_svg(data: SVGData):
    global current_gcode_text
    global filename
    try:
        svg_data = base64.b64decode(data.svg_base64).decode("utf-8")

        print(f"svg_data[:100]: {svg_data[:200]}")

        # Save original SVG for debugging
        with open("test_save.svg", "w") as f:
            f.write(svg_data)

        # Extract viewbox information
        vb_min_x, vb_min_y, vb_width, vb_height = extract_viewbox(svg_data)
        print(f"vb_min_x: {vb_min_x}, vb_min_y: {vb_min_y}, vb_width: {vb_width}, vb_height: {vb_height}")

        paths, attributes, svg_attributes = svg2paths2(StringIO(svg_data))

        # Get the Drawing object instead of writing to a file
        drawing = paths2Drawing(paths, attributes=attributes, svg_attributes=svg_attributes, filename="temp.svg")  # filename is required but won't be used

        # Convert the drawing to string
        svg_flattened = drawing.tostring()

        # Use the new svg_string_to_paths function to convert SVG to paths
        paths = svg_string_to_paths(svg_flattened)

        # Calculate scaling factors
        scale_x = data.params.width / vb_width
        scale_y = data.params.height / vb_height

        print(f"data.params.width: {data.params.width}, data.params.height: {data.params.height}")
        print(f"scale_x: {scale_x}, scale_y: {scale_y}")

        # Scale the paths
        scaled_paths = []
        for path in paths:
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
        gcode, regular_moves, travel_moves, total_length = create_gcode(scaled_paths, z_lift=data.params.clearance, size=(data.params.width, data.params.height), feedrate=data.params.feedrate)

        current_gcode_text = gcode
        filename = f"{data.params.outputFile}"

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
