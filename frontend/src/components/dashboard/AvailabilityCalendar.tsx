import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

type Slot = { start: string; end: string };

type AvailabilityMap = Record<string, Slot[]>; // key: YYYY-MM-DD

const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

const AvailabilityCalendar: React.FC<{
  availability?: AvailabilityMap;
  onChange?: (a: AvailabilityMap) => void;
  onDateClick?: (d: string) => void;
}> = ({ availability = {}, onChange, onDateClick }) => {
  const [days, setDays] = useState<Date[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [local, setLocal] = useState<AvailabilityMap>({});

  useEffect(() => {
    const arr = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
    setDays(arr);
  }, []);

  useEffect(() => {
    // initialize local copy from prop
    setLocal((prev) => {
      const copy: AvailabilityMap = { ...prev };
      days.forEach((d) => {
        const key = toIsoDate(d);
        if (!(key in copy)) copy[key] = availability[key] ? [...availability[key]] : [];
      });
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, days.length]);

  const handleSelectDay = (dateIso: string) => {
    setSelected(dateIso);
    onDateClick?.(dateIso);
  };

  const updateDaySlots = (dateIso: string, slots: Slot[]) => {
    setLocal((prev) => {
      const updated = { ...prev, [dateIso]: slots };
      onChange?.(updated);
      return updated;
    });
  };

  const addSlot = (dateIso: string) => {
    const slots = local[dateIso] || [];
    const newSlot: Slot = { start: '09:00', end: '17:00' };
    updateDaySlots(dateIso, [...slots, newSlot]);
  };

  const removeSlot = (dateIso: string, idx: number) => {
    const slots = local[dateIso] || [];
    const next = slots.filter((_, i) => i !== idx);
    updateDaySlots(dateIso, next);
  };

  const setSlotValue = (dateIso: string, idx: number, field: 'start' | 'end', value: string) => {
    const slots = local[dateIso] ? [...local[dateIso]] : [];
    if (!slots[idx]) return;
    slots[idx] = { ...slots[idx], [field]: value };
    updateDaySlots(dateIso, slots);
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {days.map((d) => {
          const key = toIsoDate(d);
          const slots = local[key] || [];
          const dayLabel = format(d, 'EEE');
          return (
            <button
              key={key}
              onClick={() => handleSelectDay(key)}
              className={`p-2 rounded-md border ${selected === key ? 'bg-primary/10 border-primary' : 'bg-card'} text-left`}
            >
              <div className="font-medium">{dayLabel}</div>
              <div className="text-muted-foreground">{d.getDate()}</div>
              <div className="mt-2 text-xs text-muted-foreground">{slots.length > 0 ? `${slots.length} slot${slots.length>1?'s':''}` : 'No slots'}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 bg-white border border-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Availability for {selected}</div>
              <div className="text-xs text-muted-foreground">Edit time slots below</div>
            </div>
            <div>
              <button className="text-sm text-primary underline" onClick={() => { addSlot(selected); }}>Add Slot</button>
            </div>
          </div>

          <div className="space-y-3">
            {(local[selected] || []).map((s, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Start</label>
                  <input type="time" value={s.start} onChange={(e) => setSlotValue(selected, idx, 'start', e.target.value)} className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End</label>
                  <input type="time" value={s.end} onChange={(e) => setSlotValue(selected, idx, 'end', e.target.value)} className="w-full border rounded px-2 py-1" />
                </div>
                <div className="flex items-end">
                  <button className="text-sm text-red-600" onClick={() => removeSlot(selected, idx)}>Remove</button>
                </div>
              </div>
            ))}

            {(local[selected] || []).length === 0 && (
              <div className="text-sm text-muted-foreground">No time slots set for this day. Click "Add Slot" to create one.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
