import { useState } from 'react';
import CartSheet from '../CartSheet';
import { Button } from '@/components/ui/button';

export default function CartSheetExample() {
  const [open, setOpen] = useState(true);
  const items = [
    {
      productId: '1',
      name: 'X-Burger Especial',
      price: 25.90,
      quantity: 2,
      notes: 'Sem cebola',
    },
    {
      productId: '2',
      name: 'Pizza Margherita',
      price: 45.00,
      quantity: 1,
    },
  ];

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Cart</Button>
      <CartSheet
        open={open}
        onOpenChange={setOpen}
        items={items}
      />
    </div>
  );
}
