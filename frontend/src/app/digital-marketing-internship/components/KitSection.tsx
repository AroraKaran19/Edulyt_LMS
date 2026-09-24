import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import { DEFAULT_KIT_ITEMS, inr, kitList, money } from "../content";

function KitArt() {
  return (
    <svg className={styles.kitArt} viewBox="0 0 360 270" aria-hidden="true">
      <path d="M52 58 84 44c6 12 16 18 28 18s22-6 28-18l32 14 30 34-24 18-12-10v122H58V100l-12 10-24-18z" fill="#F77124" />
      <path d="M84 44c6 12 16 18 28 18s22-6 28-18" fill="none" stroke="#C4551A" strokeWidth="5" />
      <rect x="88" y="104" width="48" height="10" rx="5" fill="#fff" opacity=".9" />
      <path d="M244 78a50 42 0 0 1 100 0z" fill="#2B1508" />
      <path d="M232 78h124c-4 14-30 20-62 20s-58-6-62-20z" fill="#1C0D05" />
      <circle cx="294" cy="38" r="5" fill="#F77124" />
      <circle cx="294" cy="62" r="7" fill="#F77124" />
      <rect x="262" y="124" width="78" height="112" rx="9" fill="#fff" />
      <rect x="262" y="124" width="15" height="112" rx="6" fill="#F77124" />
      <rect x="290" y="150" width="38" height="6" rx="3" fill="#F3D9C6" />
      <rect x="290" y="164" width="28" height="6" rx="3" fill="#F3D9C6" />
      <rect x="140" y="120" width="126" height="126" rx="22" fill="#2B1508" />
      <path d="M176 120c0-30 54-30 54 0" stroke="#2B1508" strokeWidth="11" fill="none" />
      <rect x="160" y="166" width="86" height="11" rx="5.5" fill="#F77124" />
      <rect x="150" y="252" width="150" height="9" rx="4.5" transform="rotate(-10 225 256)" fill="#1C0D05" />
      <rect x="150" y="252" width="26" height="9" rx="4.5" transform="rotate(-10 225 256)" fill="#F7AD24" />
    </svg>
  );
}

export default function KitSection({ settings }: { settings: CaPageSettings }) {
  const m = money(settings);
  const custom = settings.kit.items.length > 0;
  const items = kitList(custom ? settings.kit.items : DEFAULT_KIT_ITEMS, !custom);
  const { photoUrl } = settings.kit;

  return (
    <section className={styles.kitrow} aria-labelledby="ca-kit-title">
      <div className={cn(styles.wrap, styles.kitrowGrid)}>
        <div className={styles.kitPhoto}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.kitImg} src={photoUrl} alt="The Airkrit joining kit" />
          ) : (
            <KitArt />
          )}
        </div>
        <div>
          <h2 id="ca-kit-title" className={cn(styles.display, styles.sectionTitle)}>
            A kit worth {inr(m.kitValue)}, at your door.
          </h2>
          <p className={styles.sectionSub}>
            {items.charAt(0).toUpperCase() + items.slice(1)}. We ship it to the address you give us once you
            complete month 1.
          </p>
        </div>
      </div>
    </section>
  );
}
