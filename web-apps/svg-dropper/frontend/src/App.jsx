import { useState } from 'react';
import { MantineProvider, AppShell, Burger, Group, Title, Modal, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/core/styles.css';
import './index.css'
import { saveAs } from 'file-saver';

import Parameters from './components/Parameters';
import SVGDropzone from './components/SVGDropzone';
import SVGViewer from './components/SVGViewer';
import GCODEViewer from './components/GCODEViewer';
import BottomBar from './components/BottomBar';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [viewerState, setViewerState] = useState('Upload');
  const [svgContent, setSvgContent] = useState(null);
  const [svgInfo, setSvgInfo] = useState({ width: 0, height: 0, filename: '', pathCount: 0 });
  const [gcodeContent, setGcodeContent] = useState(null);
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
    svgContent: null,
  });
  const [plotData, setPlotData] = useState(null);
  const [gcodeOutdated, setGcodeOutdated] = useState(false);
  const [showTravel, setShowTravel] = useState(true);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [resizing, setResizing] = useState(false);

  const handleParamChange = (newParams) => {
    setParams(newParams);
    setGcodeOutdated(true);
  };

  const handleSVGUpload = (content, filename) => {
    setSvgContent(content);
    setViewerState('SVG');

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    let width = svgElement.getAttribute('width');
    let height = svgElement.getAttribute('height');

    if (width && height) {
      const widthUnit = width.replace(/[0-9.]/g, '');
      const heightUnit = height.replace(/[0-9.]/g, '');

      if (widthUnit === 'mm' && heightUnit === 'mm') {
        width = parseFloat(width);
        height = parseFloat(height);
      } else {
        width = 0;
        height = 0;
        setShowSizeWarning(true);
        setResizing(true);
      }
    } else {
      width = 0;
      height = 0;
      setShowSizeWarning(true);
      setResizing(true);
    }

    const outputFilename = filename.replace(/\.svg$/i, '');
    const pathCount = svgDoc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path").length;

    setSvgInfo({ width, height, filename: outputFilename, pathCount });
    setParams(prevParams => ({
      ...prevParams,
      svgContent: content,
      width,
      height,
      outputFile: outputFilename,
    }));
  };

  const handleGenerateGCODE = async () => {
    setIsGenerating(true);
    try {
      // switch for dev
      const response = await fetch('http://sofia-plotter:8082/process-svg', {
      // const response = await fetch('http://localhost:8082/process-svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg_base64: btoa(params.svgContent),
          params: params,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log(result);
      setGcodeContent(result.gcode);
      setPlotData({
        regularMoves: JSON.parse(result.plotData.regularMoves),
        travelMoves: JSON.parse(result.plotData.travelMoves)
      });
      setViewerState('GCODE');
      setGcodeOutdated(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDownloadGCODE = (params) => {
    if (gcodeContent) {
      const blob = new Blob([atob(gcodeContent)], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${params.outputFile}.gcode`);
    }
  };

  const toggleTravel = () => {
    setShowTravel(!showTravel);
  };

  return (
    <MantineProvider defaultColorScheme="light">
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
        h='100vh'
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>SVG to GCODE Converter</Title>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
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
          />
        </AppShell.Navbar>

        <AppShell.Main className="main-content">
          <div className="viewer-container">
            {viewerState === 'Upload' ? (
              <SVGDropzone onUpload={handleSVGUpload} />
            ) : viewerState === 'SVG' ? (
              <SVGViewer svgContent={svgContent} />
            ) : viewerState === 'GCODE' ? (
              <GCODEViewer plotData={plotData} showTravel={showTravel} />
            ) : null}
          </div>
          <BottomBar
            viewerState={viewerState}
            setViewerState={setViewerState}
            svgInfo={svgInfo}
            showTravel={showTravel}
            toggleTravel={toggleTravel}
          />
        </AppShell.Main>
      </AppShell>
      <Modal
        opened={showSizeWarning}
        onClose={() => setShowSizeWarning(false)}
        title="Warning: SVG Size"
      >
        <p>Your SVG did not contain any unit data. Please specify a size in the parameters sidebar.</p>
        <Button onClick={() => setShowSizeWarning(false)}>OK</Button>
      </Modal>
    </MantineProvider>
  )
}

export default App