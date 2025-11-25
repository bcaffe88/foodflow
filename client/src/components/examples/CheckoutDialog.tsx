import { useState } from 'react';
import CheckoutDialog from '../CheckoutDialog';
import { Button } from '@/components/ui/button';

export default function CheckoutDialogExample() {
  const [open, setOpen] = useState(true);
  const items = [
    {
      productId: '1',
      name: 'X-Burger Especial',
      price: 25.90,
      quantity: 2,
    },
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Checkout</Button>
      <CheckoutDialog
        open={open}
        onOpenChange={setOpen}
        items={items}
        total={56.80}
      />
    </div>
  );
}
