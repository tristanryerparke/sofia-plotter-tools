import React from 'react';
import Plot from 'react-plotly.js';
import { Container, Text } from '@mantine/core';

function GCODEViewer({ gcodeContent }) {
  const genericData = [
    {
      x: [1, 2, 3, 4],
      y: [10, 15, 13, 17],
      type: 'scatter',
      mode: 'lines+markers',
      marker: {color: 'blue'},
    }
  ];

  const layout = {
    title: 'GCODE Visualization (Not yet implemented)',
    xaxis: {title: 'X Axis'},
    yaxis: {title: 'Y Axis'},
    autosize: true,
  };

  return (
    <Container h='100%' w='100%' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* {gcodeContent ? ( */}
        <Plot
          data={genericData}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      {/* ) : (
        <Text>No GCODE Generated</Text>
      )} */}
    </Container>
  );
}

export default GCODEViewer;