import { Stack, TextInput, NumberInput, Divider, Button, Title, Text, Checkbox, Group } from '@mantine/core';

function Parameters({ params, onParamsChange, onGenerateGCODE, isGenerating, onDownloadGCODE, gcodeContent, paramsChanged }) {

  const handleParamChange = (key, value) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <Stack justify='space-between' h='100%'>
      <Stack gap='0.5rem'>
        <Title mb='md' order={4}>Parameters:</Title>

        <NumberInput
          label="Width"
          value={params.width}
          suffix='mm'
          onChange={(value) => handleParamChange('width', value)}
        /> 

        <NumberInput
          label="Height"
          value={params.height}
          suffix='mm'
          onChange={(value) => handleParamChange('height', value)}
        /> 

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
          disabled={!params.svgContent} 
          color='green' 
          onClick={onGenerateGCODE}
          loading={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate GCODE'}
        </Button>
        <Button 
          disabled={!gcodeContent || paramsChanged} 
          onClick={() => onDownloadGCODE(params)}
        >
          Download GCODE
        </Button>
        <Button disabled={true}>Send GCODE to plotter</Button>
      </Stack>
    </Stack>
  );
}

export default Parameters;