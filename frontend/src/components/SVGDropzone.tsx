import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';

interface SVGDropzoneProps {
  onUpload: (content: string, filename: string) => void;
}

export function SVGDropzone({ onUpload }: SVGDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onUpload(content, file.name);
      };
      reader.readAsText(file);
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: {
      'image/svg+xml': ['.svg']
    },
    multiple: false
  });

  return (
    <div className="h-full w-full">
      <Card 
        {...getRootProps()} 
        className={`h-full w-full cursor-pointer transition-colors shadow-none${
          isDragActive 
            ? 'bg-primary/10' 
            : 'bg-muted'
        }`}
      >
        <input {...getInputProps()} />
        <CardContent className="h-full flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-xl font-medium text-foreground mb-2">
              {isDragActive ? 'Drop SVG here' : 'Drop SVG here or click to upload'}
            </p>
            <p className="text-sm text-muted-foreground">
              File size should not exceed 5MB
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
