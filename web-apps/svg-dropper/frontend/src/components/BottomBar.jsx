import { Group, SegmentedControl, Text } from '@mantine/core';

function BottomBar({ viewerState, setViewerState, svgInfo }) {
  return (
    <Group justify="space-between" align="flex-end" w="100%" pb={0} p='sm'>
      <Text size='sm' align="left" pb='0.25rem' w='20%'>
        {viewerState === 'SVG' && `Paths: ${svgInfo.pathCount}`}
      </Text>
      <SegmentedControl
        value={viewerState}
        onChange={setViewerState}
        data={['Upload', 'SVG', 'GCode']}
      />
      <Text size='sm' align="right" pb='0.25rem' w='20%'>
        {viewerState === 'SVG' && `Size: ${svgInfo.width} x ${svgInfo.height} mm`}
      </Text>
    </Group>
  );
}

export default BottomBar;
