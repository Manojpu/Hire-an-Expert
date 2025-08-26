import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, DollarSign, User, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import AvailabilityCalendar from './AvailabilityCalendar';

const items = [
	{ to: '/expert-dashboard', label: 'Overview', icon: Home },
	{ to: '/expert-dashboard/bookings', label: 'Bookings', icon: Calendar },          
	{ to: '/expert-dashboard/analytics', label: 'Analytics', icon: PieChart },
	{ to: '/expert-dashboard/profile', label: 'Profile', icon: User },
];

const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen = true, onClose }) => {
	const loc = useLocation();
	const [availabilityOpen, setAvailabilityOpen] = useState(false);

	return (
		<aside className={`h-full bg-white border-r border-border p-4 shadow-sm ${isOpen ? '' : 'hidden md:block'}`}>
			<div className="mb-6 flex items-center gap-3">
				<div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
					<span className="text-white font-bold">E</span>
				</div>
				<div >
					<div className="text-sm font-semibold ">ExpertConnect</div>
					<div className="text-xs text-muted-foreground">Expert Dashboard</div>
				</div>
			</div>
      <div className="items-between flex flex-col h-[calc(100%-4rem)]">
  <nav className="space-y-1">
    {items.map((it) => {
      const ActiveIcon = it.icon;
      const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + '/');
      return (
        <Link
          key={it.to}
          to={it.to}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted ${
            active ? 'bg-primary/10 font-medium' : 'text-muted-foreground'
          }`}
        >
          <ActiveIcon className="w-4 h-4" />
          <span>{it.label}</span>
        </Link>
      );
    })}
  </nav>

  <div className="mt-auto">
    <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full mb-2"
        onClick={() => setAvailabilityOpen(true)}
      >
        Update Availability
      </Button>
      <Button variant="ghost" size="sm" className="w-full">
        Export Report
      </Button>
    </div>

    <div className="text-xs text-muted-foreground pt-6">
      <div>Support • Terms</div>
    </div>
  </div>
</div>


			{/* Availability Dialog */}
			<Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Update Availability</DialogTitle>
					</DialogHeader>

					<div className="mt-4">
						<AvailabilityCalendar onDateClick={(d) => console.log('date clicked', d)} />
					</div>

					<div className="mt-4 flex justify-end gap-2">
						<Button variant="outline" onClick={() => setAvailabilityOpen(false)}>
							Close
						</Button>
						<Button
							onClick={() => {
								/* save logic could go here */ setAvailabilityOpen(false);
							}}
						>
							Save
						</Button>
					</div>

					<DialogClose />
				</DialogContent>
			</Dialog>
		</aside>
	);
};

export default Sidebar;
