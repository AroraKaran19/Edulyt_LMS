import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import { DEFAULT_HEADLINE, defaultLede, inr, money } from "../content";
import ButtonLink, { scrollToHash } from "./ButtonLink";
import EarningsStack from "./EarningsStack";
import Icon from "./Icon";

/** The default lede with its two money phrases in bold, as the mockup sets them. */
const boldedLede = (m: ReturnType<typeof money>): ReactNode[] => {
  const phrases = [`a fixed ${inr(m.stipend)} every month`, `up to ${inr(m.incentiveCap)} in incentives`];
  const parts: ReactNode[] = [];
  let rest = defaultLede(m);
  for (const phrase of phrases) {
    const at = rest.indexOf(phrase);
    if (at < 0) continue;
    parts.push(rest.slice(0, at), <b key={phrase}>{phrase}</b>);
    rest = rest.slice(at + phrase.length);
  }
  parts.push(rest);
  return parts;
};

export function JdButton({ href }: { href: string }) {
  return (
    <ButtonLink href={href} variant="white" external>
      <Icon name="file" />
      Download the job description
    </ButtonLink>
  );
}

export default function HeroSection({ settings, form }: { settings: CaPageSettings; form: ReactNode }) {
  const m = money(settings);
  const { headline, lede, jdUrl } = settings.hero;

  return (
    <section id="ca-hero" className={styles.hero}>
      <div className={cn(styles.wrap, styles.heroGrid)}>
        <div>
          <h1 className={cn(styles.display, styles.heroTitle)}>{headline || DEFAULT_HEADLINE}</h1>
          <p className={styles.heroLede}>{lede || boldedLede(m)}</p>
          <div className={styles.heroActions}>
            <ButtonLink href="#apply" variant="orange" className={styles.heroApply}>
              Apply now
            </ButtonLink>
            {jdUrl && <JdButton href={jdUrl} />}
            <a
              className={styles.heroLink}
              href="#statement"
              onClick={(event) => scrollToHash(event, "#statement")}
            >
              See everything you get
            </a>
          </div>
          <EarningsStack stipend={m.stipend} incentiveCap={m.incentiveCap} />
        </div>
        {form}
      </div>
    </section>
  );
}
