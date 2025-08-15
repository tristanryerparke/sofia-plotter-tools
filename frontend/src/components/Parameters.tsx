import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

import { Check } from 'lucide-react';
import { MultiToolModal } from './MultiToolModal';

interface ParametersProps {
  params: {
    width: number;
    height: number;
    outputFile: string;
    polylineTolerance: number;
    clearance: number;
    feedrate: number;
    flipVertically: boolean;
    flipHorizontally: boolean;
    svgContent: string | null;
    optimize: boolean;
  };
  setParams: (params: any) => void;
  onGenerateGCODE: () => void;
  isGenerating: boolean;
  onDownloadGCODE: (params: any) => void;
  gcodeContent: string | null;
  gcodeOutdated: boolean;
  resizing: boolean;
  setResizing: (resizing: boolean) => void;
}

export function Parameters({ 
  params, 
  setParams, 
  onGenerateGCODE, 
  isGenerating, 
  onDownloadGCODE, 
  gcodeContent, 
  gcodeOutdated, 
  resizing, 
  setResizing
}: ParametersProps) {
  const handleParamChange = (key: string, value: any) => {
    setParams({ ...params, [key]: value });
  };

  const [uploadedToPlotter, setUploadedToPlotter] = useState(false);
  const [multiToolModalOpened, setMultiToolModalOpened] = useState(false);

  return (
    <div className="flex flex-col h-full justify-between overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Parameters</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="resize"
                checked={resizing}
                onCheckedChange={setResizing}
              />
              <Label htmlFor="resize">Resize</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                min={0}
                value={params.width || ''}
                disabled={!resizing}
                onChange={(e) => handleParamChange('width', parseFloat(e.target.value) || 0)}
                className={resizing && params.width === 0 ? 'border-destructive' : ''}
              />
              {resizing && params.width === 0 && (
                <p className="text-sm text-destructive">Width is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height (mm)</Label>
              <Input
                id="height"
                type="number"
                min={0}
                value={params.height || ''}
                disabled={!resizing}
                onChange={(e) => handleParamChange('height', parseFloat(e.target.value) || 0)}
                className={resizing && params.height === 0 ? 'border-destructive' : ''}
              />
              {resizing && params.height === 0 && (
                <p className="text-sm text-destructive">Height is required</p>
              )}
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="optimize"
                checked={params.optimize}
                onCheckedChange={(checked) => handleParamChange('optimize', checked)}
              />
              <Label htmlFor="optimize">Optimize line sorting</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="polylineTolerance">Polyline tolerance (mm)</Label>
              <Input
                id="polylineTolerance"
                type="number"
                step={0.01}
                value={params.polylineTolerance}
                onChange={(e) => handleParamChange('polylineTolerance', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clearance">Clearance (pick-up) height (mm)</Label>
              <Input
                id="clearance"
                type="number"
                value={params.clearance}
                onChange={(e) => handleParamChange('clearance', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedrate">Feedrate (mm/min)</Label>
              <Input
                id="feedrate"
                type="number"
                value={params.feedrate}
                onChange={(e) => handleParamChange('feedrate', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputFile">Output file name</Label>
              <div className="flex">
                <Input
                  id="outputFile"
                  value={params.outputFile}
                  onChange={(e) => handleParamChange('outputFile', e.target.value)}
                  className="rounded-r-none"
                />
                <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                  .gcode
                </div>
              </div>
            </div>

            <Button
              onClick={() => setMultiToolModalOpened(true)}
              disabled={!params.svgContent}
              className="w-full"
              variant="outline"
            >
              Open Multi-Tool Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Button 
          disabled={!params.svgContent || (resizing && (params.width === 0 || params.height === 0))} 
          className="w-full"
          onClick={() => {
            setUploadedToPlotter(false);
            onGenerateGCODE();
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate GCODE'}
        </Button>
        
        <Button 
          disabled={!gcodeContent || gcodeOutdated} 
          onClick={() => onDownloadGCODE(params)}
          variant="outline"
          className="w-full"
        >
          Download GCODE
        </Button>
        
        <Button 
          disabled={!gcodeContent || gcodeOutdated} 
          onClick={async () => {
            const ip = import.meta.env.VITE_SVG2G_IS_PROD === 'False' ? 'sofia-mini-plotter.local' : 'sofia-mini-plotter.local';
            await fetch(`http://${ip}:8082/send-gcode`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            setUploadedToPlotter(true);
          }}
          variant="outline"
          className="w-full"
        >
          {uploadedToPlotter && <Check className="mr-2 h-4 w-4" />}
          Send GCODE to plotter
        </Button>
      </div>
      
      <MultiToolModal 
        opened={multiToolModalOpened}
        onClose={() => setMultiToolModalOpened(false)}
        svgContent={params.svgContent}
      />
    </div>
  );
}
