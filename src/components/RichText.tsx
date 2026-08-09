/**
 * Renders plain multi-line text (from the editable settings) into paragraphs.
 * Blank lines separate paragraphs; single newlines become line breaks.
 */
export default function RichText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`prose-warm ${className}`}>
      {paragraphs.map((para, i) => (
        <p key={i}>
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
