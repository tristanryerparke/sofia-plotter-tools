import { Group, SegmentedControl, Text, Button } from '@mantine/core';

function BottomBar({ viewerState, setViewerState, svgInfo, showTravel, toggleTravel }) {
  return (
    <Group justify="space-between" align="flex-end" w="100%" pb={0} p='sm'>
      <Group>
        {viewerState === 'GCODE' && (
          <Button onClick={toggleTravel} variant='outline' size="sm" w='8rem'>
            {showTravel ? 'Hide Travel' : 'Show Travel'}
          </Button>
        )}
        <Text size='sm' align="left" pb='0.25rem'>
          {viewerState === 'SVG' && `Paths: ${svgInfo.pathCount}`}
        </Text>
      </Group>
      <SegmentedControl
        value={viewerState}
        onChange={setViewerState}
        data={['Upload', 'SVG', 'GCODE']}
      />
      <Text size='sm' align="right" pb='0.25rem' w='20%'>
        {viewerState === 'SVG' && `Size: ${svgInfo.width} x ${svgInfo.height} mm`}
      </Text>
    </Group>
  );
}

export default BottomBar;