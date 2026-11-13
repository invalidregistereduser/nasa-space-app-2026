import { useEffect, useState } from 'react';
import { bus } from '../../game/bus';
import { Icon, ITEM_ICONS } from '../components/Icon';

interface Flight {
  id: number;
  icon: string;
  x: number;
  y: number;
}

/** Collected items fly from the world into the inventory button. */
export function CollectFx() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    let counter = 0;
    const off = bus.on('ui:collect-fx', ({ icon, screenX, screenY }) => {
      counter += 1;
      const id = counter;
      setFlights((list) => [...list, { id, icon, x: screenX, y: screenY }]);
      window.setTimeout(() => setFlights((list) => list.filter((f) => f.id !== id)), 900);
    });
    return off;
  }, []);

  if (!flights.length) return null;

  return (
    <>
      {flights.map((flight) => (
        <div
          key={flight.id}
          className="pointer-events-none absolute z-30 grid h-10 w-10 place-items-center rounded-lg border border-nav-300/60 bg-space-900/80 text-nav-200 anim-collect"
          style={
            {
              left: flight.x,
              top: flight.y,
              // Toward the menu button, top left, where the pack now lives.
              '--fly-x': `${40 - flight.x}px`,
              '--fly-y': `${40 - flight.y}px`,
            } as React.CSSProperties
          }
        >
          <Icon name={ITEM_ICONS[flight.icon] ?? 'box'} className="h-5 w-5" />
        </div>
      ))}
    </>
  );
}
