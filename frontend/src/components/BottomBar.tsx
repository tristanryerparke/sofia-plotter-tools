import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BottomBarProps {
  viewerState: string;
  setViewerState: (state: string) => void;
  svgInfo: {
    width: number;
    height: number;
    filename: string;
    pathCount: number;
  };
  showTravel: boolean;
  toggleTravel: () => void;
  plotData: {
    totalLength: number;
  } | null;
}

export function BottomBar({ 
  viewerState, 
  setViewerState, 
  svgInfo, 
  showTravel, 
  toggleTravel, 
  plotData 
}: BottomBarProps) {
  return (
    <div className="grid grid-cols-3 items-center px-4 py-3 border-t bg-background min-h-[3rem]">
      <div className="flex items-center">
        {viewerState === 'GCODE' && (
          <Button onClick={toggleTravel} variant="outline" size="sm" className="w-32">
            {showTravel ? 'Hide Travel' : 'Show Travel'}
          </Button>
        )}
        {viewerState === 'SVG' && (
          <p className="text-sm text-muted-foreground">
            Paths: {svgInfo.pathCount}
          </p>
        )}
      </div>
      
      <div className="flex justify-center">
        <Tabs value={viewerState} onValueChange={setViewerState}>
          <TabsList>
            <TabsTrigger value="Upload">Upload</TabsTrigger>
            <TabsTrigger value="SVG">SVG</TabsTrigger>
            <TabsTrigger value="GCODE">GCODE</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex justify-end">
        {viewerState === 'SVG' && (
          <p className="text-sm text-muted-foreground text-right">
            Size: {svgInfo.width} x {svgInfo.height} mm
          </p>
        )}
        {viewerState === 'GCODE' && plotData && (
          <p className="text-sm text-muted-foreground text-right">
            Total travel length: {Math.round(plotData.totalLength)}mm
          </p>
        )}
      </div>
    </div>
  );
}
