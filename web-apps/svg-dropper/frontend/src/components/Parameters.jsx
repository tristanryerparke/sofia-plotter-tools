import { useState } from 'react';
import { Stack, TextInput, NumberInput, Divider, Button, Title, Text, Checkbox } from '@mantine/core';
import {IconCheck} from '@tabler/icons-react';

function Parameters({ 
  params, 
  setParams, 
  onGenerateGCODE, 
  isGenerating, 
  onDownloadGCODE, 
  gcodeContent, 
  gcodeOutdated, 
  resizing, 
  setResizing
 }) {
  const handleParamChange = (key, value) => {
    setParams({ ...params, [key]: value });
  };

  const [uploadedToPlotter, setUploadedToPlotter] = useState(false);


  return (
    <Stack justify='space-between' h='100%'>
      <Stack gap='0.5rem'>
        <Title mb='md' order={4}>Parameters:</Title>

        <Checkbox
          label="Resize"
          min={0}
          checked={resizing}
          onChange={(event) => setResizing(event.currentTarget.checked)}
        />          
        <NumberInput
          label="Width"
          min={0}
          value={params.width}
          disabled={!resizing}
          required={resizing}
          error={resizing && params.width === 0 ? 'Width is required' : null}
          suffix='mm'
          onChange={(value) => handleParamChange('width', value)}
        /> 

        <NumberInput
          label="Height"
          value={params.height}
          disabled={!resizing}
          required={resizing}
          error={resizing && params.height === 0 ? 'Height is required' : null}
          suffix='mm'
          onChange={(value) => handleParamChange('height', value)}
        /> 

        <Divider mt='xs' mb='xs' />   

        {/* <Checkbox
          label="Flip vertically (not implemented)"
          disabled={true}
          checked={params.flipVertically}
          onChange={(event) => handleParamChange('flipVertically', event.currentTarget.checked)}
        /> */}

        <NumberInput
          label="Polyline tolerance"
          value={params.polylineTolerance}
          suffix='mm'
          onChange={(value) => handleParamChange('polylineTolerance', value)}
        />

        <NumberInput
          label="Clearance (pick-up) height"
          value={params.clearance}
          suffix='mm'
          onChange={(value) => handleParamChange('clearance', value)}
        />

        <NumberInput
          label="Feedrate"
          value={params.feedrate}
          suffix='mm/min'
          onChange={(value) => handleParamChange('feedrate', value)}
        />

        <TextInput
          label="Output file name"
          rightSection={<Text size="sm" pr="1.5rem">.gcode</Text>}
          value={params.outputFile}
          onChange={(event) => handleParamChange('outputFile', event.currentTarget.value)}
        />

      </Stack>
      <Stack gap='xs'>
        <Button 
          disabled={!params.svgContent || params.width == 0 || params.height == 0} 
          color='green' 
          onClick={() => {
            setUploadedToPlotter(false);
            onGenerateGCODE();
          }}
          loading={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate GCODE'}
        </Button>
        <Button 
          disabled={!gcodeContent || gcodeOutdated} 
          onClick={() => onDownloadGCODE(params)}
        >
          Download GCODE
        </Button>
        <Button 
          rightSection={uploadedToPlotter ? <IconCheck size={16} /> : null}
          disabled={!gcodeContent || gcodeOutdated} 
          onClick={async () => {
            await fetch('http://sofia-plotter:8082/send-gcode', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            setUploadedToPlotter(true);
          }}
        >
          Send GCODE to plotter
        </Button>
      </Stack>
    </Stack>
  );
}

export default Parameters;