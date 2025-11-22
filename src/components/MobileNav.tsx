import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from './NavLink';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64" dir="rtl">
          <nav className="flex flex-col gap-4 mt-8">
            <NavLink
              to="/orders"
              onClick={() => setOpen(false)}
              className="text-lg px-4 py-2 rounded-md hover:bg-accent"
              activeClassName="bg-accent font-semibold"
            >
              הזמנות
            </NavLink>
            <NavLink
              to="/pos-devices"
              onClick={() => setOpen(false)}
              className="text-lg px-4 py-2 rounded-md hover:bg-accent"
              activeClassName="bg-accent font-semibold"
            >
              מכשירי POS
            </NavLink>
            <NavLink
              to="/debug"
              onClick={() => setOpen(false)}
              className="text-lg px-4 py-2 rounded-md hover:bg-accent"
              activeClassName="bg-accent font-semibold"
            >
              Debug
            </NavLink>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
