import { Group, SegmentedControl, Text, Button, Grid } from '@mantine/core';

function BottomBar({ viewerState, setViewerState, svgInfo, showTravel, toggleTravel }) {
  return (
    <Grid w="100%" pb={0} p='sm' h='3rem'>
      <Grid.Col span={4} align="left">
        {viewerState === 'GCODE' && (
          <Button onClick={toggleTravel} variant='outline' size="sm" w='8rem'>
            {showTravel ? 'Hide Travel' : 'Show Travel'}
          </Button>
        )}
        <Text size='sm'>
          {viewerState === 'SVG' && `Paths: ${svgInfo.pathCount}`}
        </Text>
      </Grid.Col>
      <Grid.Col span={4} align="center" justify='center'>
        <SegmentedControl
          value={viewerState}
          onChange={setViewerState}
          data={['Upload', 'SVG', 'GCODE']}
        />
      </Grid.Col>
      <Grid.Col span={4} align="right" justify='center'>
        <Text size='sm' align="right">
          {viewerState === 'SVG' && `Size: ${svgInfo.width} x ${svgInfo.height} mm`}
        </Text>
      </Grid.Col>
    </Grid>
  );
}

export default BottomBar;