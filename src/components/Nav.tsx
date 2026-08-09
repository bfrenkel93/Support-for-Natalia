const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#kids", label: "For the Kids" },
  { href: "#support", label: "For Natalia" },
  { href: "#stories", label: "Stories" },
  { href: "#help", label: "Other Ways" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-deep/60 bg-cream/85 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="font-serif text-lg font-medium text-sage-dark"
        >
          <span aria-hidden="true">💛</span>
        </a>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:gap-x-6 sm:text-base">
          {LINKS.slice(1).map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-ink-soft transition-colors hover:text-sage-dark"
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
