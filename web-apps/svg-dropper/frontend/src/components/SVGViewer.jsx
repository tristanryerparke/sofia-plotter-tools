import { Image, Container, Text } from '@mantine/core';

function SVGViewer({ svgContent }) {
  const encodedSvg = encodeURIComponent(svgContent);
  const dataUri = `data:image/svg+xml,${encodedSvg}`;

  return (
    <Container h='100%' w='100%' style={{ objectFit: 'contain', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> 
      {svgContent ? (
        <Image src={dataUri} h='100%' w='100%' alt="SVG Image" fit='contain' />
      ) : (
        <Text>No SVG Uploaded</Text>
      )}
    </Container>
  );
}

export default SVGViewer;