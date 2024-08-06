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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_gcode(strokes, z_lift, size, feedrate=20000):
    gcodefile = [
        'var start = state.upTime',
        'G21',
        f'G1 F{feedrate}'
    ]

    paths_out = []

    for path in strokes:
        new_path = [pt for pt in path if 0 <= pt[0] <= size[0] and 0 <= pt[1] <= size[1]]

        if len(new_path) > 1:
            new_path = np.array(new_path)
            gcodefile.append(f'G1 Z{z_lift:.2f}')
            gcodefile.append(f'G0 X{new_path[0][0]:.2f} Y{new_path[0][1]:.2f}')

            for pt in new_path:
                gcodefile.append(f'G1 X{pt[0]:.2f} Y{pt[1]:.2f} Z0')
            
            gcodefile.append(f'G1 Z{z_lift:.2f}')
            paths_out.append(new_path)

    gcodefile.append('echo >>"/sys/summary.txt" {job.lastFileName}, " took ", {(state.upTime - var.start)/60}, "minutes"')

    gcode_all = '\n'.join(gcodefile)
    return gcode_all, paths_out

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
        svg_data = base64.b64decode(data.svg_base64)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.svg') as temp_svg:
            temp_svg.write(svg_data)
            temp_svg_path = temp_svg.name

        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_json:
            temp_json_path = temp_json.name

        tolerance_str = f"{data.params.polylineTolerance:.2f}"

        vpype_path = os.path.join(os.path.dirname(sys.executable), 'vpype')
        command = f"'{vpype_path}' -c plot.toml read {temp_svg_path} linemerge -t 1 linesort linesimplify -t {tolerance_str} gwrite --profile json_t {temp_json_path}"
        subprocess.run(command, shell=True, check=True)

        with open(temp_json_path, 'r') as f:
            json_data = json.load(f)

        os.unlink(temp_svg_path)
        os.unlink(temp_json_path)

        layer_data = json_data['Layer']

        # Convert to list of numpy arrays
        numpy_arrays = [np.array([(point['X'], point['Y']) for point in line]) 
                        for line in layer_data.values()]
        
        gcode, paths_out = create_gcode(
            numpy_arrays,
            z_lift=data.params.clearance,
            size=(data.params.width, data.params.height),
            feedrate=data.params.feedrate
        )
        
        # Encode gcode as base64
        gcode_base64 = base64.b64encode(gcode.encode()).decode()
        
        return {"message": "SVG processed successfully", "gcode": gcode_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)