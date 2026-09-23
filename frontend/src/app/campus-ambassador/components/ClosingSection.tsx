import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import ButtonLink from "./ButtonLink";
import { JdButton } from "./HeroSection";

export default function ClosingSection({ settings }: { settings: CaPageSettings }) {
  const { jdUrl } = settings.hero;

  return (
    <section className={styles.closing} aria-labelledby="ca-closing-title">
      <div className={cn(styles.wrap, styles.closingInner)}>
        <div>
          <h2 id="ca-closing-title" className={styles.display}>
            Your first statement starts with one form.
          </h2>
          <p>Two minutes to apply. A call within 24 hours.</p>
        </div>
        <div className={styles.closingActions}>
          <ButtonLink href="#apply" variant="orange">
            Apply now
          </ButtonLink>
          {jdUrl && <JdButton href={jdUrl} />}
        </div>
      </div>
    </section>
  );
}
