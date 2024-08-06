import { useState, useEffect } from 'react';
import { Stack, TextInput, NumberInput, Divider, Button, Title, Text, Checkbox, Group } from '@mantine/core';

function Parameters({ svgContent, svgInfo, onGenerateGCODE, isGenerating, onDownloadGCODE, gcodeContent }) {

  const [params, setParams] = useState({
    width: 0,
    height: 0,
    outputFile: "output",
    polylineTolerance: 0.5,
    clearance: 5,
    feedrate: 5000,
    flipVertically: false,
    flipHorizontally: false,
  });

  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    if (svgInfo) {
      setParams(prevParams => ({
        ...prevParams,
        width: svgInfo.width,
        height: svgInfo.height,
        outputFile: svgInfo.filename,
      }));
    }
  }, [svgInfo]);

  const handleGenerateGCODE = () => {
    onGenerateGCODE(params);
  };

  return (
    <Stack justify='space-between' h='100%'>
      <Stack gap='0.5rem'>
        <Title mb='md' order={4}>Parameters:</Title>

        <Checkbox
          label="Resize"
          checked={resizing}
          disabled={true}
          onChange={(event) => setResizing(event.currentTarget.checked)}
        />          
        <NumberInput
          label="Width"
          value={params.width}
          disabled={!resizing}
          suffix='mm'
          onChange={(value) => setParams({...params, width: value})}
        /> 

        <NumberInput
          label="Height"
          value={params.height}
          disabled={!resizing}
          suffix='mm'
          onChange={(value) => setParams({...params, height: value})}
        /> 

        <Divider mt='xs' mb='xs' />

        <Group>
          <Checkbox
            label="Flip vertically"
            disabled={true}
            checked={params.flipVertically}
            onChange={(event) => setParams({...params, flipVertically: event.currentTarget.checked})}
          />
          <Checkbox
            disabled={true}
            label="Flip horizontally"
            checked={params.flipHorizontally}
            onChange={(event) => setParams({...params, flipHorizontally: event.currentTarget.checked})}
          />
        </Group>

        <NumberInput
          label="Polyline tolerance"
          value={params.polylineTolerance}
          suffix='mm'
          onChange={(value) => setParams({...params, polylineTolerance: value})}
        />

        <NumberInput
          label="Clearence (pick-up) height"
          value={params.clearance}
          suffix='mm'
          onChange={(value) => setParams({...params, clearance: value})}
        />

        <NumberInput
          label="Feedrate"
          value={params.feedrate}
          suffix='mm/min'
          onChange={(value) => setParams({...params, feedrate: value})}
        />

        <TextInput
          label="Output file name"
          rightSection={<Text size="sm" pr="1.5rem">.gcode</Text>}
          value={params.outputFile}
          onChange={(event) => setParams({...params, outputFile: event.currentTarget.value})}
        />

      </Stack>
      <Stack gap='xs'>
        <Button 
          disabled={!svgContent} 
          color='green' 
          onClick={handleGenerateGCODE}
          loading={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate GCODE'}
        </Button>
        <Button 
          disabled={!gcodeContent} 
          onClick={onDownloadGCODE}
        >
          Download GCODE
        </Button>
        <Button disabled={true}>Send GCODE to plotter</Button>
      </Stack>
      
    </Stack>
  );
}

export default Parameters;