from fastapi import HTTPException
import requests
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for GCODE state
current_gcode_text = ""
filename = ""


def set_gcode_data(gcode_text: str, file_name: str):
    """Set the current GCODE data"""
    global current_gcode_text, filename
    current_gcode_text = gcode_text
    filename = file_name


async def send_gcode(hostname: str):
    """Send GCODE to the plotter machine"""
    global current_gcode_text, filename

    logger.info(f"Attempting to connect to plotter at hostname: {hostname}")

    # Attempt to connect to the machine
    connect_url = f"http://{hostname}/machine/connect"
    logger.info(f"Trying to connect to: {connect_url}")

    try:
        conn_res = requests.get(connect_url, timeout=10)
        session_key = conn_res.json()["sessionKey"]
        logger.info("Successfully connected to plotter, session key obtained")

    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection refused when trying to connect to {hostname} at {connect_url}")
        logger.error(f"Connection error details: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Failed to connect to plotter at {hostname}. Make sure the plotter is accessible and the hostname is correct.")
    except requests.exceptions.Timeout as e:
        logger.error(f"Timeout when trying to connect to {hostname} at {connect_url}")
        raise HTTPException(status_code=504, detail=f"Timeout connecting to plotter at {hostname}. The plotter may be unresponsive.")
    except Exception as e:
        logger.error(f"Unexpected error when connecting to {hostname}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error connecting to plotter: {str(e)}")

    try:
        # Check if file exists and handle naming conflicts
        while True:
            file_check_url = f"http://{hostname}/machine/fileinfo/gcodes/{filename}.gcode"
            logger.info(f"Checking if file exists: {file_check_url}")

            file_exists_res = requests.get(file_check_url, headers={"X-Session-Key": session_key}, timeout=10)

            try:
                file_exists_res.json()
            except Exception:
                break

            if file_exists_res.status_code == 200:
                logger.info(f"File {filename}.gcode already exists, generating new name")
                match = re.match(r"^(.*?)(\((\d+)\))?$", filename.split(".")[0])
                if match:
                    base, _, num = match.groups()
                    num = int(num) + 1 if num else 2
                    filename = f"{base}({num})"
                logger.info(f"New filename: {filename}")

        logger.info(f"Uploading GCODE file as: {filename}.gcode")
        logger.info(f"GCODE preview (first 100 chars): {current_gcode_text[:100]}")

        # Upload the GCODE file
        upload_url = f"http://{hostname}/machine/file/gcodes/{filename}.gcode"
        logger.info(f"Uploading to: {upload_url}")

        upload_res = requests.put(upload_url, current_gcode_text, headers={"X-Session-Key": session_key}, timeout=30)

        logger.info(f"Upload response status: {upload_res.status_code}")
        logger.info(f"Upload response: {upload_res.text}")

        if upload_res.status_code != 201:
            logger.error(f"Failed to upload GCODE. Status: {upload_res.status_code}, Response: {upload_res.text}")
            raise HTTPException(status_code=500, detail=f"Failed to send GCODE to plotter. Status: {upload_res.status_code}")

        logger.info(f"Successfully uploaded GCODE file: {filename}.gcode")
        return {"message": f"GCODE successfully sent to plotter as {filename}.gcode"}

    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection lost during file operations with {hostname}: {str(e)}")
        raise HTTPException(status_code=503, detail="Lost connection to plotter during file operations")
    except requests.exceptions.Timeout as e:
        logger.error(f"Timeout during file operations with {hostname}: {str(e)}")
        raise HTTPException(status_code=504, detail="Timeout during file operations with plotter")
    except Exception as e:
        logger.error(f"Unexpected error during file operations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error during file operations: {str(e)}")
