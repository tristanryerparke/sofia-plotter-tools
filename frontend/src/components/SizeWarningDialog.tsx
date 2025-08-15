import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SizeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SizeWarningDialog({ open, onOpenChange }: SizeWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-50 w-100'>
        <DialogHeader>
          <DialogTitle>Warning: SVG Size</DialogTitle>
        </DialogHeader>
        <p className="mb-4">Your SVG did not contain any unit data. Please specify a size in the parameters sidebar.</p>
        <Button onClick={() => onOpenChange(false)}>OK</Button>
      </DialogContent>
    </Dialog>
  );
}
