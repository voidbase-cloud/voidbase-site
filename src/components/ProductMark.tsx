// A product's mark, at one size, for the comparison pages.
//
// Four of these have a logo in devicon, which is a collection built for exactly this and keeps the licensing
// straight. The other three do not, and drawing something logo-shaped for a real company would be inventing their
// brand, so they get a lettered tile instead: clearly ours, clearly a stand-in, and the same footprint as the real
// ones so a row of them still lines up.
export interface Product {
  name: string;
  /** the file in public/images/logos, when devicon has one */
  logo?: string;
  /** the colour the tile uses when it does not */
  tint?: string;
}

export const PRODUCTS: Record<string, Product> = {
  voidbase: { name: "voidbase", logo: "/images/logo.svg" },
  firebase: { name: "Firebase", logo: "/images/logos/firebase.svg" },
  supabase: { name: "Supabase", logo: "/images/logos/supabase.svg" },
  appwrite: { name: "Appwrite", logo: "/images/logos/appwrite.svg" },
  cloudflare: { name: "Cloudflare", logo: "/images/logos/cloudflare.svg" },
  pocketbase: { name: "PocketBase", tint: "#b8dbd9" },
  convex: { name: "Convex", tint: "#f3b64b" },
  encore: { name: "Encore", tint: "#a78bfa" },
};

export default function ProductMark({ id, size = 28 }: { id: keyof typeof PRODUCTS | string; size?: number }) {
  const p = PRODUCTS[id];
  if (!p) return null;
  if (p.logo) {
    return <img className="product-mark" src={p.logo} alt="" width={size} height={size} loading="lazy" />;
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
