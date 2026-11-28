const logo = new URL('../../assets/karmarkar_color_logo.png', import.meta.url).href;

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative w-12 h-12 shrink-0 overflow-hidden">
        <img src={logo} alt="Karmarker logo" className="absolute left-1/2 top-1/2 w-[246%] max-w-none -translate-x-1/2 -translate-y-1/2" style={{ clipPath: 'polygon(50.1% 17.2%, 70.4% 83.5%, 29.7% 83.5%)' }} />
      </div>
      <div className={collapsed ? 'hidden' : 'hidden sm:block min-w-0'}>
        <p className="text-[22px] font-black text-primary leading-none font-headline">Karmarker</p>
        <p className="mt-1 text-sm font-bold text-blue-700">Rostering</p>
      </div>
    </div>
  );
}
