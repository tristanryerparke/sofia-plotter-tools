import { MantineProvider } from '@mantine/core';
import { AppShell, Burger, Group, Skeleton, Title, Text, Container } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import './index.css'

function App() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineProvider defaultColorScheme="light">
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>SVG to GCODE Converter</Title>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <Title order={4}>Parameters:</Title>
          {Array(15)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} h={28} mt="sm" animate={false} />
            ))}
        </AppShell.Navbar>

        <AppShell.Main className="main-content">
          <div className="dropzone-container">
            <Dropzone
              onDrop={(files) => {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                  const content = event.target.result;
                  console.log('File content:', content);
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
          </div>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  )
}

export default App