import { Group, SegmentedControl, Text, Button, Grid } from '@mantine/core';

function BottomBar({ viewerState, setViewerState, svgInfo, showTravel, toggleTravel, plotData }) {
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
          {viewerState === 'GCODE' && plotData && `Total travel length : ${Math.round(plotData.totalLength)}mm`}
        </Text>
      </Grid.Col>
    </Grid>
  );
}

export default BottomBar;