export interface PathData {
  d: string;
  stroke: string;
  strokeWidth: string;
  fill: string;
}

export interface Group {
  id: string;
  name: string;
  zIndex?: number;
  paths: PathData[];
  color?: string;
}

export interface ParsedSvgData {
  groups: Group[];
  colors: string[];
}

interface CSSRule {
  selector: string;
  styles: Record<string, string>;
}

/**
 * Parses CSS rules from a style element
 */
function parseCSSRules(styleElement: Element): CSSRule[] {
  const cssText = styleElement.textContent || '';
  const rules: CSSRule[] = [];
  
  // Simple CSS parser - handles basic class selectors
  const ruleMatches = cssText.match(/\.[^{]+\{[^}]+\}/g);
  
  if (ruleMatches) {
    ruleMatches.forEach(ruleText => {
      const selectorMatch = ruleText.match(/\.([^{]+)/);
      const stylesMatch = ruleText.match(/\{([^}]+)\}/);
      
      if (selectorMatch && stylesMatch) {
        const selector = selectorMatch[1].trim();
        const stylesText = stylesMatch[1];
        const styles: Record<string, string> = {};
        
        // Parse individual style declarations
        const declarations = stylesText.split(';').filter(decl => decl.trim());
        declarations.forEach(decl => {
          const [property, value] = decl.split(':').map(s => s.trim());
          if (property && value) {
            styles[property] = value;
          }
        });
        
        rules.push({ selector, styles });
      }
    });
  }
  
  return rules;
}

/**
 * Resolves the computed style for a path element, considering both direct attributes and CSS classes
 */
function getComputedPathStyle(pathElement: Element, cssRules: CSSRule[]): {
  stroke: string;
  strokeWidth: string;
  fill: string;
} {
  let stroke = pathElement.getAttribute('stroke') || '#000000';
  let strokeWidth = pathElement.getAttribute('stroke-width') || '1';
  let fill = pathElement.getAttribute('fill') || 'none';
  
  // Apply CSS rules based on class attribute
  const classAttr = pathElement.getAttribute('class');
  if (classAttr) {
    const classes = classAttr.split(/\s+/);
    classes.forEach(className => {
      const rule = cssRules.find(r => r.selector === className);
      if (rule) {
        if (rule.styles.stroke) stroke = rule.styles.stroke;
        if (rule.styles['stroke-width']) strokeWidth = rule.styles['stroke-width'];
        if (rule.styles.fill) fill = rule.styles.fill;
      }
    });
  }
  
  return { stroke, strokeWidth, fill };
}

/**
 * Parses SVG content and extracts groups and paths with proper CSS handling
 */
export function parseSVGContent(svgContent: string, sortMode: 'group' | 'color' = 'group'): ParsedSvgData {
  if (!svgContent) return { groups: [], colors: [] };

  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Parse CSS rules from style elements
    const styleElements = svgDoc.querySelectorAll('style');
    const cssRules: CSSRule[] = [];
    styleElements.forEach(styleEl => {
      cssRules.push(...parseCSSRules(styleEl));
    });
    
    const groups: Group[] = [];
    const colors = new Set<string>();
    const ungroupedPaths: PathData[] = [];

    // Find all groups and track their DOM order (z-index)
    const groupElements = svgDoc.querySelectorAll('g');
    groupElements.forEach((group, index) => {
      const groupId = group.getAttribute('id') || `group-${index}`;
      const paths = Array.from(group.querySelectorAll('path'));
      
      if (paths.length > 0) {
        const pathsData: PathData[] = paths.map(path => {
          const computedStyle = getComputedPathStyle(path, cssRules);
          colors.add(computedStyle.stroke);
          
          return {
            d: path.getAttribute('d') || '',
            stroke: computedStyle.stroke,
            strokeWidth: computedStyle.strokeWidth,
            fill: computedStyle.fill
          };
        });

        groups.push({
          id: groupId,
          name: groupId,
          zIndex: index,
          paths: pathsData
        });
      }
    });

    // Find ungrouped paths
    const allPaths = Array.from(svgDoc.querySelectorAll('path'));
    const groupedPaths = new Set<Element>();
    
    groupElements.forEach(group => {
      Array.from(group.querySelectorAll('path')).forEach(path => {
        groupedPaths.add(path);
      });
    });

    allPaths.forEach(path => {
      if (!groupedPaths.has(path)) {
        const computedStyle = getComputedPathStyle(path, cssRules);
        colors.add(computedStyle.stroke);
        
        ungroupedPaths.push({
          d: path.getAttribute('d') || '',
          stroke: computedStyle.stroke,
          strokeWidth: computedStyle.strokeWidth,
          fill: computedStyle.fill
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
      const pathsWithColor: PathData[] = [];
      
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

    // Sort groups by z-index (DOM order) for group mode
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
}

/**
 * Generates filtered SVG content based on visibility state
 */
export function generateFilteredSVG(
  originalSvgContent: string,
  groups: Group[],
  visibilityState: Record<string, boolean>
): string {
  if (!originalSvgContent) return '';

  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(originalSvgContent, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    // Create a new SVG with only visible paths
    const newSvg = svgElement.cloneNode(false) as SVGElement;
    
    // Copy non-path children (like defs, style, etc.)
    Array.from(svgElement.children).forEach(child => {
      if (child.tagName !== 'g' && child.tagName !== 'path') {
        newSvg.appendChild(child.cloneNode(true));
      }
    });
    
    groups.forEach(group => {
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
    return originalSvgContent;
  }
}