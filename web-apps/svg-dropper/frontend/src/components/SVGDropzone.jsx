import { Dropzone } from '@mantine/dropzone';
import { Container, Text } from '@mantine/core';
import '@mantine/dropzone/styles.css';


function SVGDropzone({ onUpload }) {
  return (
    <Dropzone
      onDrop={(files) => {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          onUpload(content, file.name);
        };
        reader.readAsText(file);
      }}
      maxSize={5 * 1024 ** 2}
      accept={['image/svg+xml']}
      h="100%"
      w="100%"
      className="dropzone"
      multiple={false}
    >
      <Dropzone.Idle>
        <Container h="100%" fluid className="dropzone-content">
          <Text size="xl" inline>
            Drop SVG here or click to upload
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            File size should not exceed 5mb
          </Text>
        </Container>
      </Dropzone.Idle>
    </Dropzone>
  );
}

export default SVGDropzone;