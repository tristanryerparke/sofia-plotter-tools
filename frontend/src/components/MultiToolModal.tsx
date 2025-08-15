import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { SVGViewer } from './SVGViewer';

interface Group {
  id: string;
  name: string;
  zIndex?: number;
  paths: Array<{
    d: string;
    stroke: string;
    strokeWidth: string;
    fill: string;
  }>;
  color?: string;
}

interface MultiToolModalProps {
  opened: boolean;
  onClose: () => void;
  svgContent: string | null;
}

export function MultiToolModal({ opened, onClose, svgContent }: MultiToolModalProps) {
  const [sortMode, setSortMode] = useState<'group' | 'color'>('group');
  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});
  const [toolAssignments, setToolAssignments] = useState<Record<string, string>>({});

  // Parse SVG content to extract groups and paths
  const parsedSvgData = useMemo(() => {
    if (!svgContent) return { groups: [], colors: [] };

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      const groups: Group[] = [];
      const colors = new Set<string>();
      const ungroupedPaths: Array<{
        d: string;
        stroke: string;
        strokeWidth: string;
        fill: string;
      }> = [];

      // Find all groups and track their DOM order (z-index)
      const groupElements = svgDoc.querySelectorAll('g');
      groupElements.forEach((group, index) => {
        const groupId = group.getAttribute('id') || `group-${index}`;
        const paths = Array.from(group.querySelectorAll('path'));
        
        if (paths.length > 0) {
          groups.push({
            id: groupId,
            name: groupId,
            zIndex: index,
            paths: paths.map(path => ({
              d: path.getAttribute('d') || '',
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
            d: path.getAttribute('d') || '',
            stroke: stroke || '#000000',
            strokeWidth: path.getAttribute('stroke-width') || '1',
            fill: path.getAttribute('fill') || 'none'
          });
        }
      });

      // Add base group for ungrouped paths if any exist
      if (ungroupedPaths.length > 0) {
        groups.push({
          id: 'base',
          name: 'Base (Ungrouped)',
          zIndex: -1,
          paths: ungroupedPaths
        });
      }

      // Convert colors to groups for color sorting mode
      const colorGroups: Group[] = Array.from(colors).map(color => {
        const pathsWithColor: Array<{
          d: string;
          stroke: string;
          strokeWidth: string;
          fill: string;
        }> = [];
        
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

      // Sort groups by z-index (DOM order)
      const sortedGroups = sortMode === 'group' 
        ? groups.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
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
    const initialVisibilityState: Record<string, boolean> = {};
    const initialToolState: Record<string, string> = {};
    parsedSvgData.groups.forEach(group => {
      initialVisibilityState[group.id] = true;
      initialToolState[group.id] = 'skip';
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
      const newSvg = svgElement.cloneNode(false) as SVGElement;
      
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

  const toggleGroupVisibility = (groupId: string) => {
    setVisibilityState(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const toggleAllGroups = (visible: boolean) => {
    const newState: Record<string, boolean> = {};
    parsedSvgData.groups.forEach(group => {
      newState[group.id] = visible;
    });
    setVisibilityState(newState);
  };

  const handleToolAssignment = (groupId: string, toolValue: string) => {
    setToolAssignments(prev => ({
      ...prev,
      [groupId]: toolValue
    }));
  };

  if (!svgContent) {
    return (
      <Dialog open={opened} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Multi-Tool Configuration</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">No SVG content available. Please upload an SVG file first.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={opened} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full">
        <DialogHeader>
          <DialogTitle>Multi-Tool Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full">
          {/* Sidebar for group controls */}
          <div className="w-96 border-r pr-4 flex flex-col h-full">
            {/* Sort controls */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Sort by:</p>
              <Tabs value={sortMode} onValueChange={(value) => setSortMode(value as 'group' | 'color')}>
                <TabsList className="w-full">
                  <TabsTrigger value="group" className="flex-1">Groups</TabsTrigger>
                  <TabsTrigger value="color" className="flex-1">Colors</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex justify-between items-center mb-4">
              <p className="font-medium">Groups ({parsedSvgData.groups.length})</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleAllGroups(true)}
                >
                  Show All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleAllGroups(false)}
                >
                  Hide All
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {parsedSvgData.groups.map(group => (
                <div key={group.id} className="p-3 border rounded">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.paths.length} path{group.paths.length !== 1 ? 's' : ''}
                        {group.color && (
                          <>
                            {' • '}
                            <span 
                              className="inline-block w-3 h-3 rounded-sm align-middle mr-1"
                              style={{ backgroundColor: group.color }}
                            />
                            {group.color}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={toolAssignments[group.id] || 'skip'}
                        onValueChange={(value) => handleToolAssignment(group.id, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {toolOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={visibilityState[group.id] ? "default" : "outline"}
                        size="icon"
                        onClick={() => toggleGroupVisibility(group.id)}
                        className="h-8 w-8"
                      >
                        {visibilityState[group.id] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status and buttons in sidebar */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                {Object.values(visibilityState).filter(Boolean).length} of {parsedSvgData.groups.length} groups visible
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cancel
                </Button>
                <Button onClick={onClose} className="w-full">
                  Apply Configuration
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas area for SVG preview */}
          <div className="flex-1 flex items-center justify-center border rounded">
            <SVGViewer svgContent={filteredSvgContent} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
