import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import { defaultFaqs, money } from "../content";
import ButtonLink from "./ButtonLink";
import Icon from "./Icon";

export default function FaqSection({ settings }: { settings: CaPageSettings }) {
  const faqs = settings.faqs.items.length ? settings.faqs.items : defaultFaqs(money(settings));
  const { whatsappLink } = settings.form;

  return (
    <section className={styles.faq} aria-labelledby="ca-faq-title">
      <div className={cn(styles.wrap, styles.faqGrid)}>
        <div>
          <h2 id="ca-faq-title" className={cn(styles.display, styles.sectionTitle)}>
            Questions, answered.
          </h2>
          <p className={styles.sectionSub}>Still unsure about something? Message us and a counsellor will reply.</p>
          {whatsappLink && (
            <ButtonLink href={whatsappLink} variant="white" external className={styles.faqCta}>
              <Icon name="chat" className={styles.waIcon} />
              Chat with us on WhatsApp
            </ButtonLink>
          )}
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <details key={`${i}-${faq.question}`} open={i === 0}>
              <summary>
                {faq.question}
                <span className={styles.faqPlus}>
                  <Icon name="plus" />
                </span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
