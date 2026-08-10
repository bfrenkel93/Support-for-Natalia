const LINKS = [
  { href: "#gathering", label: "Gathering" },
  { href: "#calendar", label: "Calendar" },
  { href: "#kids", label: "For the Kids" },
  { href: "/weekend-ideas", label: "Things to Do" },
  { href: "#support", label: "For Natalia" },
  { href: "#stories", label: "Stories" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-parchment/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <a
          href="#top"
          className="font-serif text-base font-normal tracking-tight text-ink"
        >
          Natalia &amp; the Kids
        </a>
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[0.72rem] font-medium uppercase tracking-wide text-ink-soft transition-colors duration-300 hover:text-bronze"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        {/* Compact list on small screens */}
        <ul className="flex items-center gap-4 text-[0.62rem] uppercase tracking-wide text-ink-faint md:hidden">
          <li>
            <a href="#kids" className="hover:text-bronze">
              Kids
            </a>
          </li>
          <li>
            <a href="#support" className="hover:text-bronze">
              Natalia
            </a>
          </li>
          <li>
            <a href="#stories" className="hover:text-bronze">
              Stories
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
