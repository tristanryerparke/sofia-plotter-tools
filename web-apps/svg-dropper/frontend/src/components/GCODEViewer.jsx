import { useState } from 'react';
import Plot from 'react-plotly.js';
import { Container, Text } from '@mantine/core';

function GCODEViewer({ plotData, showTravel }) {
  if (!plotData) {
    return (
      <Container h='100%' w='100%' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text>No GCODE Generated</Text>
      </Container>
    );
  }

  const { regularMoves, travelMoves } = plotData;

  const data = [
    ...travelMoves.map((move, index) => ({
      x: move.map(point => point[0]),
      y: move.map(point => point[1]),
      type: 'scatter',
      mode: 'lines',
      line: { color: 'red', width: 1 },
      name: 'Travel',
      legendgroup: 'Travel',
      showlegend: index === 0,
      visible: showTravel,
      hovertemplate: `Travel Move ${index + 1}<br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>`,
      zIndex: 1,
    })),
    ...regularMoves.map((move, index) => ({
      x: move.map(point => point[0]),
      y: move.map(point => point[1]),
      type: 'scatter',
      mode: 'lines',
      line: { color: 'blue', width: 1 },
      name: 'Drawing',
      legendgroup: 'Drawing',
      showlegend: index === 0,
      hovertemplate: `Curve ${index + 1}<br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>`,
      zIndex: 2,
    })),
  ];

  const layout = {
    title: 'GCODE Visualization',
    xaxis: { title: 'X Axis' },
    yaxis: { title: 'Y Axis', scaleanchor: 'x', scaleratio: 1 },
    autosize: true,
  };

  return (
    <Container h='100%' w='100%' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Plot
        data={data}
        layout={layout}
        style={{ width: '100%', height: '100%', padding: '0' }}
        useResizeHandler={true}
      />
    </Container>
  );
}

export default GCODEViewer;