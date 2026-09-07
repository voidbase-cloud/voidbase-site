// A product's mark, at one size, for the comparison pages.
//
// Four of these have a logo in devicon, which is a collection built for exactly this and keeps the licensing
// straight. The other three do not, and drawing something logo-shaped for a real company would be inventing their
// brand, so they get a lettered tile instead: clearly ours, clearly a stand-in, and the same footprint as the real
// ones so a row of them still lines up.
export interface Product {
  name: string;
  /** a full-colour logo, drawn as an image */
  logo?: string;
  /** a single-colour logo, drawn through a mask so it can be tinted: the source files are black on white */
  mask?: string;
  /** the colour a masked mark or a lettered tile uses */
  tint?: string;
}

export const PRODUCTS: Record<string, Product> = {
  voidbase: { name: "voidbase", logo: "/images/logo.svg" },
  firebase: { name: "Firebase", logo: "/images/logos/firebase.svg" },
  supabase: { name: "Supabase", logo: "/images/logos/supabase.svg" },
  appwrite: { name: "Appwrite", logo: "/images/logos/appwrite.svg" },
  cloudflare: { name: "Cloudflare", logo: "/images/logos/cloudflare.svg" },
  // thesvg.org carries these three. PocketBase's is a single-colour mark drawn for a light background, so it is
  // masked and tinted rather than shown as an image. Encore publishes only a wordmark, which cannot sit in a square
  // slot beside a round logo, so it keeps a lettered tile.
  pocketbase: { name: "PocketBase", mask: "/images/logos/pocketbase.svg", tint: "#ededed" },
  convex: { name: "Convex", logo: "/images/logos/convex.svg" },
  encore: { name: "Encore", tint: "#a78bfa" },
};

export default function ProductMark({ id, size = 28 }: { id: keyof typeof PRODUCTS | string; size?: number }) {
  const p = PRODUCTS[id];
  if (!p) return null;
  if (p.logo) {
    return <img className="product-mark" src={p.logo} alt="" width={size} height={size} loading="lazy" />;
  }
  if (p.mask) {
    return (
      <span
        className="product-mark product-mark-masked"
        style={{ width: size, height: size, backgroundColor: p.tint, maskImage: `url(${p.mask})`, WebkitMaskImage: `url(${p.mask})` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className="product-mark product-mark-letter"
      style={{ width: size, height: size, color: p.tint, fontSize: Math.round(size * 0.5) }}
      aria-hidden="true"
    >
      {p.name.slice(0, 1)}
    </span>
  );
}
