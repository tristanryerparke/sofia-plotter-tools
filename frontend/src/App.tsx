import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import "./index.css";

import { Parameters } from './components/Parameters';
import { SVGDropzone } from './components/SVGDropzone';
import { SVGViewer } from './components/SVGViewer';
import { GCODEViewer } from './components/GCODEViewer';
import { BottomBar } from './components/BottomBar';
import { SizeWarningDialog } from './components/SizeWarningDialog';

interface PlotData {
  regularMoves: number[][][];
  travelMoves: number[][][];
  totalLength: number;
  estimatedTimeMinutes: number;
}

export function App() {
  const [viewerState, setViewerState] = useState('Upload');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgInfo, setSvgInfo] = useState({ 
    width: 0, 
    height: 0, 
    filename: '', 
    pathCount: 0 
  });
  const [gcodeContent, setGcodeContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [params, setParams] = useState({
    width: 0,
    height: 0,
    outputFile: "output",
    polylineTolerance: 0.25,
    clearance: 5,
    feedrate: 5000,
    flipVertically: false,
    flipHorizontally: false,
    svgContent: null as string | null,
    optimize: false,
  });
  const [useMultiTool, setUseMultiTool] = useState(false);
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [gcodeOutdated, setGcodeOutdated] = useState(false);
  const [showTravel, setShowTravel] = useState(true);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [resizing, setResizing] = useState(false);

  const handleParamChange = (newParams: any) => {
    setParams(newParams);
    setGcodeOutdated(true);
  };

  const handleSVGUpload = (content: string, filename: string) => {
    setSvgContent(content);
    setViewerState('SVG');
    setUseMultiTool(false); // Reset multi-tool configuration when new file is uploaded

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    let width = svgElement.getAttribute('width');
    let height = svgElement.getAttribute('height');

    if (width && height) {
      const widthUnit = width.replace(/[0-9.]/g, '');
      const heightUnit = height.replace(/[0-9.]/g, '');

      if (widthUnit === 'mm' && heightUnit === 'mm') {
        width = parseFloat(width) as any;
        height = parseFloat(height) as any;
      } else {
        width = 0 as any;
        height = 0 as any;
        setShowSizeWarning(true);
        setResizing(true);
      }
    } else {
      width = 0 as any;
      height = 0 as any;
      setShowSizeWarning(true);
      setResizing(true);
    }

    const outputFilename = filename.replace(/\.svg$/i, '');
    const pathCount = svgDoc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path").length;

    setSvgInfo({ 
      width: width as number, 
      height: height as number, 
      filename: outputFilename, 
      pathCount 
    });
    setParams(prevParams => ({
      ...prevParams,
      svgContent: content,
      width: width as number,
      height: height as number,
      outputFile: outputFilename,
    }));
  };

  const handleGenerateGCODE = async () => {
    setIsGenerating(true);
    try {
      // const ip = import.meta.env.VITE_SVG2G_IS_PROD === 'False' ? 'sofia-mini-plotter' : 'sofia-mini-plotter';
      const ip = 'localhost';
      const response = await fetch(`http://${ip}:8000/process-svg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg_base64: btoa(params.svgContent || ''),
          params: params,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      setGcodeContent(result.gcode);
      setPlotData({
        regularMoves: JSON.parse(result.plotData.regularMoves),
        travelMoves: JSON.parse(result.plotData.travelMoves),
        totalLength: result.plotData.totalLength,
        estimatedTimeMinutes: result.plotData.estimatedTimeMinutes
      });
      setViewerState('GCODE');
      setGcodeOutdated(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadGCODE = (params: any) => {
    if (gcodeContent) {
      const blob = new Blob([atob(gcodeContent)], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${params.outputFile}.gcode`);
    }
  };

  const toggleTravel = () => {
    setShowTravel(!showTravel);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background px-4 py-2">
        <h1 className="text-2xl font-bold">SVG to GCODE Converter</h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-background overflow-y-auto">
          <Parameters 
            params={params}
            setParams={handleParamChange}
            onGenerateGCODE={handleGenerateGCODE}
            isGenerating={isGenerating}
            onDownloadGCODE={handleDownloadGCODE}
            gcodeContent={gcodeContent}
            gcodeOutdated={gcodeOutdated}
            resizing={resizing}
            setResizing={setResizing}
            useMultiTool={useMultiTool}
            setUseMultiTool={setUseMultiTool}
          />
        </aside>

        {/* Main viewer area */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-4 min-h-0 overflow-hidden">
            {viewerState === 'Upload' ? (
              <SVGDropzone onUpload={handleSVGUpload} />
            ) : viewerState === 'SVG' ? (
              <SVGViewer svgContent={svgContent} />
            ) : viewerState === 'GCODE' ? (
              <GCODEViewer plotData={plotData} showTravel={showTravel} />
            ) : null}
          </div>
          
          <div className="flex-shrink-0">
            <BottomBar
              viewerState={viewerState}
              setViewerState={setViewerState}
              svgInfo={svgInfo}
              showTravel={showTravel}
              toggleTravel={toggleTravel}
              plotData={plotData}
            />
          </div>
        </main>
      </div>

      {/* Size warning modal */}
      <SizeWarningDialog 
        open={showSizeWarning} 
        onOpenChange={setShowSizeWarning} 
      />
    </div>
  );
}

export default App;