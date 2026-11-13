interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

/** Compact line-icon set drawn to a 24x24 grid. */
const PATHS: Record<string, React.ReactNode> = {
  oxygen: (
    <>
      <circle cx="9" cy="12" r="4.4" />
      <circle cx="17" cy="12" r="3.2" />
    </>
  ),
  water: <path d="M12 3.5c3.6 4.2 5.6 7 5.6 9.5a5.6 5.6 0 1 1-11.2 0c0-2.5 2-5.3 5.6-9.5Z" />,
  food: (
    <>
      <path d="M12 20c-4 0-6.5-3-6.5-7 0-2.8 1.9-5 4.4-5 1.2 0 1.7.5 2.1.5s.9-.5 2.1-.5c2.5 0 4.4 2.2 4.4 5 0 4-2.5 7-6.5 7Z" />
      <path d="M12 8c0-2 1-3.5 3-4.2" />
    </>
  ),
  energy: <path d="M13.5 3 6 13h5l-.8 8L18 11h-5l.5-8Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </>
  ),
  moon: <path d="M19 14.5A8 8 0 0 1 9.5 5a8 8 0 1 0 9.5 9.5Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  map: (
    <>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  backpack: (
    <>
      <path d="M6 9.5A4 4 0 0 1 10 5.5h4a4 4 0 0 1 4 4V20H6Z" />
      <path d="M9.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5M9 13h6" />
    </>
  ),
  nav: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5Z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.5 13H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5.3 6.3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1A1.6 1.6 0 0 0 11 2.3V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1Z" />
    </>
  ),
  pause: <path d="M9 5v14M15 5v14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrowRight: <path d="M5 12h13m-5-5 5 5-5 5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  plant: (
    <>
      <path d="M12 21v-7" />
      <path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5Z" />
      <path d="M12 14c0-3.5 2.2-5.5 5.5-5.5 0 3.4-2.2 5.5-5.5 5.5Z" />
      <path d="M7 21h10" />
    </>
  ),
  seed: (
    <>
      <path d="M12 4c4 2.5 5.5 5.5 5.5 8.5A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.5C6.5 9.5 8 6.5 12 4Z" />
      <path d="M12 18V9" />
    </>
  ),
  drop: <path d="M12 4c3 3.8 4.8 6.3 4.8 8.6a4.8 4.8 0 1 1-9.6 0C7.2 10.3 9 7.8 12 4Z" />,
  thermometer: (
    <>
      <path d="M10 13.5V6a2 2 0 1 1 4 0v7.5a4 4 0 1 1-4 0Z" />
      <circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  lamp: (
    <>
      <path d="M8 4h8l2.5 7h-13Z" />
      <path d="M12 11v4M9.5 19h5" />
    </>
  ),
  power: (
    <>
      <path d="M12 3.5v8" />
      <path d="M6.8 7.2a7.5 7.5 0 1 0 10.4 0" />
    </>
  ),
  antenna: (
    <>
      <path d="M12 20V11" />
      <path d="M7 20h10" />
      <path d="M4.5 9.5a9 9 0 0 1 15 0" />
      <circle cx="12" cy="9" r="2" />
    </>
  ),
  box: (
    <>
      <path d="M4 8.5 12 5l8 3.5v7L12 19l-8-3.5Z" />
      <path d="M4 8.5 12 12l8-3.5M12 12v7" />
    </>
  ),
  tools: (
    <>
      <path d="M14.5 6.5a3.5 3.5 0 0 0 4.7 4.6L21 13l-8 8-2-2 1.9-1.8A3.5 3.5 0 0 0 8.3 12L10 10.2Z" />
      <path d="m4 6 3-3 4 4-3 3Z" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="8" width="15" height="9" rx="2" />
      <path d="M21 11.5v2" />
      <path d="M6.5 11v3M10 11v3" />
    </>
  ),
  solar: (
    <>
      <path d="M4 16h16l-2-9H6Z" />
      <path d="M12 7v9M7.5 11.5h9M12 16v4M9 20h6" />
    </>
  ),
  panel: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1.6" />
      <path d="m6.5 17 5-10M12 17l5-10" />
    </>
  ),
  frame: (
    <>
      <path d="M4 19V9l8-4 8 4v10" />
      <path d="M4 19h16M8 19v-7M16 19v-7M8 12h8" />
    </>
  ),
  tray: (
    <>
      <rect x="3.5" y="9" width="17" height="7" rx="1.6" />
      <path d="M7 9V7h10v2M7 16v2h10v-2" />
    </>
  ),
  potato: (
    <>
      <path d="M7.5 9.5c2.5-3.5 7.5-4 9.3-1.3 1.9 2.7.3 8-3.5 9.8-3.2 1.5-6.8-.2-7.4-3.2-.4-2.1.5-3.9 1.6-5.3Z" />
      <path d="M10 11.5h.01M13.5 13h.01M11.5 15h.01" />
    </>
  ),
  lettuce: (
    <>
      <path d="M12 20c-4.5 0-7-3-7-6.5 0-1 .3-1.8.8-2.5.7.5 1.4.7 2.2.6-.6-1.2-.5-2.6.3-3.7.9.6 1.9.9 2.9.7-.3-1.4.2-2.9 1.3-3.8 1 .9 1.6 2.3 1.4 3.7 1 .1 2-.2 2.8-.8.8 1.1.9 2.6.3 3.8.8.1 1.6-.1 2.3-.6.5.7.7 1.6.7 2.6 0 3.5-2.5 6.5-7 6.5Z" />
    </>
  ),
  tomato: (
    <>
      <path d="M12 8.5c3.3 0 5.6 2.3 5.6 5.2 0 3-2.4 5.3-5.6 5.3s-5.6-2.3-5.6-5.3c0-2.9 2.3-5.2 5.6-5.2Z" />
      <path d="M9.4 7.8 12 8.6l2.6-.8M12 5.2v3.4" />
      <path d="M9.6 6.6 12 8.6l2.4-2" />
    </>
  ),
  beans: (
    <>
      <path d="M8.8 4.6c3.4 0 6.2 2.9 6.2 6.6s-2.8 6.6-6.2 6.6c-1.5 0-2.4-1-2.4-2.6 0-3.4 2.6-4 2.6-6.4 0-1.6-1.2-2.1-1.2-3.2 0-.6.4-1 1-1Z" />
      <path d="M13.5 12.4c2.6.4 4.4 2.3 4.4 4.6 0 1.4-.9 2.4-2.3 2.4-2.2 0-3.6-1.7-4-3.8" />
    </>
  ),
  herbs: (
    <>
      <path d="M12 20V9" />
      <path d="M12 12c-2.8 0-4.6-1.8-4.6-4.4 2.8 0 4.6 1.7 4.6 4.4ZM12 12c2.8 0 4.6-1.8 4.6-4.4-2.8 0-4.6 1.7-4.6 4.4Z" />
      <path d="M12 16c-2.2 0-3.6-1.4-3.6-3.4 2.2 0 3.6 1.3 3.6 3.4ZM12 16c2.2 0 3.6-1.4 3.6-3.4-2.2 0-3.6 1.3-3.6 3.4Z" />
      <path d="M9.5 20h5" />
    </>
  ),
  mug: (
    <>
      <path d="M5 8h11v7.5a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 5 15.5Z" />
      <path d="M16 10.5h1.8a2.2 2.2 0 1 1 0 4.4H16" />
      <path d="M8 5.5c0 .9.8 1 .8 2M12 5c0 .9.8 1 .8 2" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9c0-2 1.4-3.6 3.4-4-.2 2.1-1.4 3.6-3.4 4ZM12 9c0-2-1.4-3.6-3.4-4 .2 2.1 1.4 3.6 3.4 4ZM12 14c0-2 1.4-3.6 3.4-4-.2 2.1-1.4 3.6-3.4 4ZM12 14c0-2-1.4-3.6-3.4-4 .2 2.1 1.4 3.6 3.4 4Z" />
    </>
  ),
  canister: (
    <>
      <rect x="8" y="6" width="8" height="14" rx="4" />
      <path d="M10.5 6V4.5h3V6M9.5 12h5" />
    </>
  ),
  ration: (
    <>
      <rect x="5" y="6" width="14" height="13" rx="2" />
      <path d="M5 10h14M9.5 6V3.5M14.5 6V3.5" />
    </>
  ),
  ship: (
    <>
      <path d="M12 3c2.8 2.5 4.2 5.8 4.2 9.3 0 2.4-.6 4.6-1.7 6.2H9.5C8.4 16.9 7.8 14.7 7.8 12.3 7.8 8.8 9.2 5.5 12 3Z" />
      <path d="M7.8 13 5 16v3l3-1.4M16.2 13 19 16v3l-3-1.4" />
      <circle cx="12" cy="10" r="1.8" />
    </>
  ),
  dome: (
    <>
      <path d="M3.5 18a8.5 8.5 0 0 1 17 0Z" />
      <path d="M12 9.5V18M7 11.5c1.2 1.8 1.8 4 1.8 6.5M17 11.5c-1.2 1.8-1.8 4-1.8 6.5M3.5 18h17" />
    </>
  ),
  rover: (
    <>
      <path d="M4 14h13l2-4H6Z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
      <path d="M9 10V6h5" />
    </>
  ),
  crater: (
    <>
      <ellipse cx="12" cy="13" rx="8.5" ry="5.5" />
      <ellipse cx="12" cy="13" rx="4.5" ry="2.8" />
    </>
  ),
  canyon: <path d="M3 19 7 8l3 5 3-9 3 11 5-4v8Z" />,
  dune: <path d="M3 17c3-4 5-6 7.5-6s3.5 2 6 2S20 10 21 9v8Z" />,
  ridge: <path d="m3 18 5-9 3.5 5L15 6l6 12Z" />,
  menu: (
    <g>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </g>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 2.8 20h18.4Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  science: (
    <>
      <path d="M9.5 3.5v6L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3l-4.7-8.5v-6" />
      <path d="M8 3.5h8M7.5 14h9" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 3.5L17 12H6Z" />
    </>
  ),
  save: (
    <>
      <path d="M5 5h11l3 3v11H5Z" />
      <path d="M8 5v5h7V5M8 19v-5h8v5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-1.8 4.2L9 15l1.8-4.2Z" />
    </>
  ),
  radio: (
    <>
      <path d="M4.5 10.5 17 5" />
      <rect x="3" y="10.5" width="18" height="9" rx="2" />
      <circle cx="8" cy="15" r="2" />
      <path d="M13 13.5h5M13 16.5h5" />
    </>
  ),
};

export function Icon({ name, className = 'h-4 w-4', strokeWidth = 1.6 }: IconProps) {
  const path = PATHS[name] ?? PATHS.info;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export const ITEM_ICONS: Record<string, string> = {
  oxygen_canister: 'canister',
  ration_pack: 'ration',
  repair_kit: 'tools',
  power_cell: 'battery',
  greenhouse_frame: 'frame',
  glass_panels: 'panel',
  water_recycler: 'water',
  solar_panel: 'solar',
  planting_containers: 'tray',
  seed_vault: 'seed',
  comm_antenna: 'antenna',
  potato: 'potato',
  lettuce: 'lettuce',
  tomato: 'tomato',
  beans: 'beans',
  herbs: 'herbs',
  wheat: 'wheat',
};
