from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import base64
import subprocess
import tempfile
import os
import json
import sys
import numpy as np
from xml.etree import ElementTree as ET
import re

from utils import create_gcode, strip_svg_units, extract_viewbox, truncate_decimals

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SVGParams(BaseModel):
    width: float
    height: float
    outputFile: str
    polylineTolerance: float
    clearance: float
    feedrate: int
    flipVertically: bool
    flipHorizontally: bool

class SVGData(BaseModel):
    svg_base64: str
    params: SVGParams

@app.post("/process-svg")
async def process_svg(data: SVGData):
    try:
        svg_data = base64.b64decode(data.svg_base64).decode()

        svg_data = strip_svg_units(svg_data)
        
        vb_min_x, vb_min_y, vb_width, vb_height = extract_viewbox(svg_data)

        with tempfile.NamedTemporaryFile(delete=False, suffix='.svg') as temp_svg:
            temp_svg.write(svg_data)
            temp_svg_path = temp_svg.name

        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_json:
            temp_json_path = temp_json.name

        tolerance_str = f"{data.params.polylineTolerance:.2f}"

        vpype_path = os.path.join(os.path.dirname(sys.executable), 'vpype')
        
        command = f"'{vpype_path}' -c plot.toml read {temp_svg_path} linemerge -t 1 linesort linesimplify -t {tolerance_str} gwrite --profile json_t {temp_json_path}"
        print(command)
        subprocess.run(command, shell=True, check=True)

        with open(temp_json_path, 'r') as f:
            json_data = json.load(f)

        os.unlink(temp_svg_path)
        os.unlink(temp_json_path)

        layer_data = json_data['Layer']

        # Calculate scaling factors
        scale_x = data.params.width / vb_width
        scale_y = data.params.height / vb_height

        # Convert to list of numpy arrays and scale
        numpy_arrays = [np.array([((point['X'] - vb_min_x) * scale_x, (point['Y'] - vb_min_y) * scale_y) for point in line]) 
                        for line in layer_data.values()]
        
        gcode, regular_moves, travel_moves = create_gcode(
            numpy_arrays,
            z_lift=data.params.clearance,
            size=(data.params.width, data.params.height),
            feedrate=data.params.feedrate
        )
        
        # Encode gcode as base64
        gcode_base64 = base64.b64encode(gcode.encode()).decode()

        print(travel_moves)
        
        return {
            "message": "SVG processed successfully",
            "gcode": gcode_base64,
            "plotData": {
                "regularMoves": truncate_decimals(regular_moves),
                "travelMoves": truncate_decimals(travel_moves)
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8082)