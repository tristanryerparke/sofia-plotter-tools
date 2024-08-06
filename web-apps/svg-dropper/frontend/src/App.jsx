import { useState, useEffect } from 'react';
import { MantineProvider, AppShell, Burger, Group, Title } from '@mantine/core';
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
      }
    } else {
      width = 0;
      height = 0;
    }

    const outputFilename = filename.replace(/\.svg$/i, '');
    const pathCount = svgDoc.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path").length;

    setSvgInfo({ width, height, filename: outputFilename, pathCount });
  };

  const handleGenerateGCODE = async (params) => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://sofia-plotter.local:8082/process-svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          svg_base64: btoa(svgContent),
          params: params,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log(result);
      setGcodeContent(result.gcode);
      setViewerState('GCode');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadGCODE = () => {
    if (gcodeContent) {
      const blob = new Blob([atob(gcodeContent)], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${svgInfo.filename}.gcode`);
    }
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
            svgContent={svgContent} 
            svgInfo={svgInfo} 
            onGenerateGCODE={handleGenerateGCODE}
            isGenerating={isGenerating}
            onDownloadGCODE={handleDownloadGCODE}
            gcodeContent={gcodeContent}
          />
        </AppShell.Navbar>

        <AppShell.Main className="main-content">
          <div className="viewer-container">
            {viewerState === 'Upload' ? (
              <SVGDropzone onUpload={handleSVGUpload} />
            ) : viewerState === 'SVG' ? (
              <SVGViewer svgContent={svgContent} />
            ) : viewerState === 'GCode' ? (
              <GCODEViewer gcodeContent={gcodeContent} />
            ) : null}
          </div>
          <BottomBar
            viewerState={viewerState}
            setViewerState={setViewerState}
            svgInfo={svgInfo}
          />
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  )
}

export default App