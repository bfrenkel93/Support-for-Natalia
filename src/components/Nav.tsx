const LINKS = [
  { href: "#kids", label: "For the Kids" },
  { href: "#events", label: "Events" },
  { href: "#support", label: "For Natalia" },
  { href: "#stories", label: "Stories" },
  { href: "#help", label: "Other Ways" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2 font-serif text-base text-ink"
        >
          <span aria-hidden="true">💛</span>
          <span className="hidden sm:inline">For Natalia &amp; the Kids</span>
        </a>
        <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm sm:gap-x-6">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-ink-soft transition-colors hover:text-clay-dark"
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
