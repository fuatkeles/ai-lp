import { buttonVariants, badgeVariants } from '../components/ui/button';
import { cn } from '../utils';

describe('UI Component Variants', () => {
  test('buttonVariants generates correct classes', () => {
    const defaultButton = buttonVariants();
    expect(defaultButton).toContain('inline-flex');
    expect(defaultButton).toContain('items-center');
    
    const primaryButton = buttonVariants({ variant: 'default' });
    expect(primaryButton).toContain('bg-primary');
    
    const outlineButton = buttonVariants({ variant: 'outline' });
    expect(outlineButton).toContain('border');
  });

  test('cn utility works with component variants', () => {
    const customButton = cn(buttonVariants(), 'custom-class');
    expect(customButton).toContain('inline-flex');
    expect(customButton).toContain('custom-class');
  });
});