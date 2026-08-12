import { ImageResponse } from "next/og";
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
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 6,
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
            fontSize: 84,
            lineHeight: 1.05,
            fontWeight: 500,
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
    { ...size }
  );
}
