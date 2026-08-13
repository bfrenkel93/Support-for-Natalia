import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getFamilyBySlug } from "@/lib/families";

// Dynamic social-share preview card for a family page. When someone shares
// their link in a text or on social, this warm branded image appears.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A place to help a grieving family";

export default async function OgImage({
  params,
}: {
  params: { slug: string };
}) {
  const family = await getFamilyBySlug(params.slug);
  const content = (family?.content || {}) as {
    intro_title?: string;
    eyebrow?: string;
  };
  const name = content.intro_title || family?.display_name || "A place to help";
  const eyebrow =
    content.eyebrow?.trim() || "A place to show up for a grieving family";

  // Bundle the brand serif (Lora) so the card matches the site's typography.
  // If the files can't be read for any reason, fall back to the default font
  // so the card still renders rather than erroring.
  let fonts:
    | { name: string; data: Buffer; style: "normal"; weight: 500 | 600 }[]
    | undefined;
  try {
    const [lora500, lora600] = await Promise.all([
      readFile(join(process.cwd(), "assets/lora-500.woff")),
      readFile(join(process.cwd(), "assets/lora-600.woff")),
    ]);
    fonts = [
      { name: "Lora", data: lora500, style: "normal", weight: 500 },
      { name: "Lora", data: lora600, style: "normal", weight: 600 },
    ];
  } catch {
    fonts = undefined;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F5F1E8",
          color: "#2E2A23",
          padding: "72px 84px",
          fontFamily: "Lora",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 23,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#8B6A43",
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 86,
            lineHeight: 1.05,
            fontWeight: 600,
            maxWidth: 980,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            fontWeight: 500,
            color: "#675f52",
          }}
        >
          <div style={{ display: "flex" }}>familygriefsupport.org</div>
          <div style={{ display: "flex", color: "#8B6A43" }}>
            Meals · Kids · Help · Memories
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts ? { fonts } : {}),
    }
  );
}
