import { useEffect, useRef } from 'react';

interface PlotData {
  regularMoves: number[][][];
  travelMoves: number[][][];
  totalLength: number;
  estimatedTimeMinutes: number;
}

interface GCODEViewerProps {
  plotData: PlotData | null;
  showTravel: boolean;
}

export function GCODEViewer({ plotData, showTravel }: GCODEViewerProps) {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotData || !plotRef.current) return;

    // Dynamically import plotly to avoid SSR issues
    import('plotly.js-dist-min').then((Plotly) => {
      if (!plotRef.current) return;

      const { regularMoves, travelMoves } = plotData;

      const data = [
        ...travelMoves.map((move, index) => ({
          x: move.map(point => point[0]),
          y: move.map(point => point[1]),
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: 'red', width: 1 },
          name: 'Travel',
          legendgroup: 'Travel',
          showlegend: index === 0,
          visible: showTravel,
          hovertemplate: `Travel Move ${index + 1}<br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>`,
        })),
        ...regularMoves.map((move, index) => ({
          x: move.map(point => point[0]),
          y: move.map(point => point[1]),
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: 'blue', width: 1 },
          name: 'Drawing',
          legendgroup: 'Drawing',
          showlegend: index === 0,
          hovertemplate: `Curve ${index + 1}<br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>`,
        })),
      ];

      const allX = data.flatMap(d => d.x);
      const allY = data.flatMap(d => d.y);
      const maxX = Math.max(...allX);
      const maxY = Math.max(...allY);

      const layout = {
        title: 'GCODE Visualization',
        xaxis: { title: 'X Axis', range: [0, maxX] },
        yaxis: { title: 'Y Axis', range: [0, maxY], scaleanchor: 'x', scaleratio: 1 },
        autosize: true,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { t: 50, r: 50, b: 50, l: 50 }
      };

      const config = {
        displayModeBar: false,
        responsive: true
      };

      // Clear any existing plot
      plotRef.current.innerHTML = '';
      
      // Create the plot
      Plotly.newPlot(plotRef.current, data, layout, config);
      
    }).catch((error) => {
      console.error('Failed to load Plotly:', error);
      if (plotRef.current) {
        plotRef.current.innerHTML = '<div class="text-red-500 text-center p-4">Failed to load visualization</div>';
      }
    });

    // Cleanup function
    return () => {
      if (plotRef.current) {
        import('plotly.js-dist-min').then((Plotly) => {
          if (plotRef.current) {
            Plotly.purge(plotRef.current);
          }
        });
      }
    };
  }, [plotData, showTravel]);

  if (!plotData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">No GCODE Generated</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div ref={plotRef} className="w-full h-full" />
    </div>
  );
}
