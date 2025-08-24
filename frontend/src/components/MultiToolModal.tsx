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
import { parseSVGContent, generateFilteredSVG } from '../utils/svgParser';

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
    return parseSVGContent(svgContent || '', sortMode);
  }, [svgContent, sortMode]);

  // Tool options for dropdown
  const toolOptions = [
    { value: 'skip', label: 'Skip' },
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
      initialToolState[group.id] = '1';
    });
    setVisibilityState(initialVisibilityState);
    setToolAssignments(initialToolState);
  }, [parsedSvgData.groups]);

  // Generate filtered SVG content based on visibility state
  const filteredSvgContent = useMemo(() => {
    return generateFilteredSVG(svgContent || '', parsedSvgData.groups, visibilityState);
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
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] overflow-hidden p-4 gap-2">
        <DialogHeader className="shrink-0 p-0 m-0">
          <DialogTitle className="text-lg font-semibold p-0 m-0">Multi-Tool Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-row gap-4 h-full min-h-0 grow">
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
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">{group.name}</p> 
                        <span 
                          className="inline-block w-3 h-3 rounded-sm align-middle mr-1"
                          style={{ backgroundColor: group.color }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group.paths.length} path{group.paths.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={toolAssignments[group.id] || '1'}
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
          <div className="flex-1 flex items-center justify-center ">
            <SVGViewer svgContent={filteredSvgContent} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
