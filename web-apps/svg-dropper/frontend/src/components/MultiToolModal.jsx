import { useState, useEffect, useMemo } from 'react';
import { Modal, Group, Button, Stack, Text, Divider, Box, SegmentedControl, ActionIcon, Select } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import SVGViewer from './SVGViewer';

function MultiToolModal({ opened, onClose, svgContent }) {
  const [sortMode, setSortMode] = useState('group'); // 'group' or 'color'
  const [visibilityState, setVisibilityState] = useState({});
  const [toolAssignments, setToolAssignments] = useState({});
  const [svgGroups, setSvgGroups] = useState([]);

  // Parse SVG content to extract groups and paths
  const parsedSvgData = useMemo(() => {
    if (!svgContent) return { groups: [], colors: [] };

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      const groups = [];
      const colors = new Set();
      const ungroupedPaths = [];

      // Find all groups and track their DOM order (z-index)
      const groupElements = svgDoc.querySelectorAll('g');
      groupElements.forEach((group, index) => {
        const groupId = group.getAttribute('id') || `group-${index}`;
        const paths = Array.from(group.querySelectorAll('path'));
        
        if (paths.length > 0) {
          groups.push({
            id: groupId,
            name: groupId,
            zIndex: index, // Track DOM order for z-index sorting
            paths: paths.map(path => ({
              d: path.getAttribute('d'),
              stroke: path.getAttribute('stroke') || '#000000',
              strokeWidth: path.getAttribute('stroke-width') || '1',
              fill: path.getAttribute('fill') || 'none'
            }))
          });

          // Collect colors from paths in groups
          paths.forEach(path => {
            const stroke = path.getAttribute('stroke');
            if (stroke && stroke !== 'none') {
              colors.add(stroke);
            }
          });
        }
      });

      // Find ungrouped paths
      const allPaths = Array.from(svgDoc.querySelectorAll('path'));
      const groupedPaths = new Set();
      
      groupElements.forEach(group => {
        Array.from(group.querySelectorAll('path')).forEach(path => {
          groupedPaths.add(path);
        });
      });

      allPaths.forEach(path => {
        if (!groupedPaths.has(path)) {
          const stroke = path.getAttribute('stroke');
          if (stroke && stroke !== 'none') {
            colors.add(stroke);
          }
          ungroupedPaths.push({
            d: path.getAttribute('d'),
            stroke: stroke || '#000000',
            strokeWidth: path.getAttribute('stroke-width') || '1',
            fill: path.getAttribute('fill') || 'none'
          });
        }
      });

      // Add base group for ungrouped paths if any exist
      // Ungrouped paths are typically at the beginning of the SVG, so give them z-index -1
      if (ungroupedPaths.length > 0) {
        groups.push({
          id: 'base',
          name: 'Base (Ungrouped)',
          zIndex: -1, // Place ungrouped paths at the bottom layer
          paths: ungroupedPaths
        });
      }

      // Convert colors to groups for color sorting mode
      const colorGroups = Array.from(colors).map(color => {
        const pathsWithColor = [];
        
        // Add paths from groups
        groups.forEach(group => {
          group.paths.forEach(path => {
            if (path.stroke === color) {
              pathsWithColor.push(path);
            }
          });
        });

        return {
          id: `color-${color}`,
          name: `Color: ${color}`,
          paths: pathsWithColor,
          color: color
        };
      });

      // Sort groups by z-index (DOM order) - higher z-index appears first in list (top layer first)
      const sortedGroups = sortMode === 'group' 
        ? groups.sort((a, b) => b.zIndex - a.zIndex) 
        : colorGroups;

      return {
        groups: sortedGroups,
        colors: Array.from(colors)
      };
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return { groups: [], colors: [] };
    }
  }, [svgContent, sortMode]);

  // Tool options for dropdown
  const toolOptions = [
    { value: 'skip', label: 'No tool (skip)' },
    { value: '1', label: 'Tool 1' },
    { value: '2', label: 'Tool 2' },
    { value: '3', label: 'Tool 3' },
    { value: '4', label: 'Tool 4' },
    { value: '5', label: 'Tool 5' },
    { value: '6', label: 'Tool 6' },
    { value: '7', label: 'Tool 7' },
    { value: '8', label: 'Tool 8' },
  ];

  // Initialize visibility state and tool assignments when groups change
  useEffect(() => {
    const initialVisibilityState = {};
    const initialToolState = {};
    parsedSvgData.groups.forEach(group => {
      initialVisibilityState[group.id] = true; // All groups visible by default
      initialToolState[group.id] = '1'; // Default to Tool 1
    });
    setVisibilityState(initialVisibilityState);
    setToolAssignments(initialToolState);
  }, [parsedSvgData.groups]);

  // Generate filtered SVG content based on visibility state
  const filteredSvgContent = useMemo(() => {
    if (!svgContent) return '';

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Create a new SVG with only visible paths
      const newSvg = svgElement.cloneNode(false);
      
      parsedSvgData.groups.forEach(group => {
        if (visibilityState[group.id]) {
          group.paths.forEach(pathData => {
            const pathElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', pathData.d);
            pathElement.setAttribute('stroke', pathData.stroke);
            pathElement.setAttribute('stroke-width', pathData.strokeWidth);
            pathElement.setAttribute('fill', pathData.fill);
            pathElement.setAttribute('stroke-linecap', 'round');
            newSvg.appendChild(pathElement);
          });
        }
      });

      return new XMLSerializer().serializeToString(newSvg);
    } catch (error) {
      console.error('Error generating filtered SVG:', error);
      return svgContent;
    }
  }, [svgContent, parsedSvgData.groups, visibilityState]);

  const toggleGroupVisibility = (groupId) => {
    setVisibilityState(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleAllGroups = (visible) => {
    const newState = {};
    parsedSvgData.groups.forEach(group => {
      newState[group.id] = visible;
    });
    setVisibilityState(newState);
  };

  const handleToolAssignment = (groupId, toolValue) => {
    setToolAssignments(prev => ({
      ...prev,
      [groupId]: toolValue
    }));
  };

  if (!svgContent) {
    return (
      <Modal opened={opened} onClose={onClose} title="Multi-Tool Configuration" size="xl">
        <Text c="dimmed">No SVG content available. Please upload an SVG file first.</Text>
      </Modal>
    );
  }

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Multi-Tool Configuration" 
      size="90vw"
      styles={{
        content: {
          height: '90vh',
          maxHeight: '90vh'
        },
        body: {
          height: 'calc(90vh - 65px)', // Account for header height
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Group align="stretch" style={{ flex: 1, height: 0 }}>
        {/* Sidebar for group controls */}
        <Box style={{ width: '400px', borderRight: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', height: '100%' }} pr="md">
          {/* Sort controls */}
          <Group mb="md">
            <Text size="sm" fw={500}>Sort by:</Text>
            <SegmentedControl
              w='100%'
              value={sortMode}
              onChange={setSortMode}
              data={[
                { label: 'Groups', value: 'group' },
                { label: 'Colors', value: 'color' }
              ]}
              size="xs"
            />
          </Group>

          <Group justify="space-between" mb="md">
            <Text fw={500}>Groups ({parsedSvgData.groups.length})</Text>
            <Group gap="xs">
              <Button 
                size="xs" 
                variant="light" 
                onClick={() => toggleAllGroups(true)}
              >
                Show All
              </Button>
              <Button 
                size="xs" 
                variant="light" 
                onClick={() => toggleAllGroups(false)}
              >
                Hide All
              </Button>
            </Group>
          </Group>

          <Stack gap="xs" style={{ maxHeight: 'calc(100% - 180px)', overflowY: 'auto' }}>
            {parsedSvgData.groups.map(group => (
              <Box key={group.id} p="xs" style={{ border: '1px solid #e9ecef', borderRadius: '4px' }}>
                <Group justify="space-between" align="center">
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{group.name}</Text>
                    <Text size="xs" c="dimmed">
                      {group.paths.length} path{group.paths.length !== 1 ? 's' : ''}
                      {group.color && (
                        <>
                          {' • '}
                          <span style={{ 
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            backgroundColor: group.color,
                            borderRadius: '2px',
                            verticalAlign: 'middle',
                            marginRight: '4px'
                          }}></span>
                          {group.color}
                        </>
                      )}
                    </Text>
                  </Box>
                  <Group gap="xs" align="center">
                    <Select
                      placeholder="Tool"
                      data={toolOptions}
                      value={toolAssignments[group.id] || '1'}
                      onChange={(value) => handleToolAssignment(group.id, value)}
                      size="xs"
                      w={120}
                    />
                    <ActionIcon
                      variant={visibilityState[group.id] ? "light" : "filled"}
                      color={visibilityState[group.id] ? "blue" : "gray"}
                      onClick={() => toggleGroupVisibility(group.id)}
                      size="sm"
                    >
                      {visibilityState[group.id] ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                    </ActionIcon>
                  </Group>
                </Group>
              </Box>
            ))}
          </Stack>

          {/* Status and buttons in sidebar */}
          <Box mt="auto" pt="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Text size="sm" c="dimmed" mb="md">
              {Object.values(visibilityState).filter(Boolean).length} of {parsedSvgData.groups.length} groups visible
            </Text>
            <Stack gap="xs">
              <Button variant="default" onClick={onClose} fullWidth>
                Cancel
              </Button>
              <Button onClick={onClose} fullWidth>
                Apply Configuration
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Canvas area for SVG preview */}
        <Box style={{ 
          flex: 1, 
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px'
        }}>
          <SVGViewer svgContent={filteredSvgContent} />
        </Box>

      </Group>
    </Modal>
  );
}

export default MultiToolModal;