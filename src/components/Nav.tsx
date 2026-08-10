const LINKS = [
  { href: "#gathering", label: "Gathering" },
  { href: "#calendar", label: "Calendar" },
  { href: "#kids", label: "For the Kids" },
  { href: "/weekend-ideas", label: "Things to Do" },
  { href: "#support", label: "For Natalia" },
  { href: "#events", label: "Events" },
  { href: "#stories", label: "Stories" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-parchment/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-content flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-10 sm:py-4">
        <a
          href="#top"
          className="shrink-0 font-serif text-base font-normal tracking-tight text-ink"
        >
          Natalia &amp; the Kids
        </a>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:justify-end sm:gap-x-6">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[0.6rem] font-medium uppercase tracking-wide text-ink-soft transition-colors duration-300 hover:text-bronze sm:text-[0.72rem]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
