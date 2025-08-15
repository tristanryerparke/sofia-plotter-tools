interface SVGViewerProps {
  svgContent: string | null;
}

export function SVGViewer({ svgContent }: SVGViewerProps) {
  if (!svgContent) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">No SVG Uploaded</p>
      </div>
    );
  }

  const encodedSvg = encodeURIComponent(svgContent);
  const dataUri = `data:image/svg+xml,${encodedSvg}`;

  return (
    <div className="h-full w-full flex items-center justify-center p-0">
      <img 
        src={dataUri} 
        alt="SVG Image" 
        className="max-h-full max-w-full object-contain border border-border"
        style={{
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
}
