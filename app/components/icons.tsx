const paths = {
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 9h16c0-2-2-3-2-9"/><path d="M10 21h4"/></>,
  external: <><path d="M8 16 17 7"/><path d="M8 7h9v9"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  car: <><path d="m5 10 1.5-4.2A1.2 1.2 0 0 1 7.6 5h8.8a1.2 1.2 0 0 1 1.1.8L19 10"/><rect x="3" y="10" width="18" height="7" rx="2"/><path d="M5 17v2m14-2v2M7 13.5h1m8 0h1"/></>,
  pin: <><path d="M19 10c0 4.5-7 10-7 10S5 14.5 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chat: <path d="M20 15a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />,
  send: <><path d="m21 3-7 18-3-8-8-3 18-7Z"/><path d="M11 13 21 3"/></>,
  list: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8m-8 4h5"/></>,
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
