import { Image, Container, Text } from '@mantine/core';

function SVGViewer({ svgContent }) {
  const encodedSvg = encodeURIComponent(svgContent);
  const dataUri = `data:image/svg+xml,${encodedSvg}`;

  return (
    <Container h='100%' w='100%' p={0} m={0} style={{ 
      objectFit: 'contain', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: 0,
      margin: 0,
      }}> 
      {svgContent ? (
        <Image 
          src={dataUri} 
          h='100%' 
          w='100%' 
          alt="SVG Image" 
          fit='contain'
          m={0}
          p={0}
          style={{
            border: '1px solid #dee2e6',
            margin: 0,
            padding: 0,
          }}
        />

      ) : (
        <Text>No SVG Uploaded</Text>
      )}
    </Container>
  );
}

export default SVGViewer;