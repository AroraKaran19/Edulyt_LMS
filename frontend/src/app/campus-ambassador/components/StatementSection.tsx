import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import {
  DEFAULT_KIT_ITEMS,
  DEFAULT_STATEMENT_FOOTER_AMOUNT,
  DEFAULT_STATEMENT_FOOTER_LABEL,
  DEFAULT_STATEMENT_ROWS,
  inr,
  money,
  resolveStatementText,
} from "../content";
import Icon from "./Icon";

export default function StatementSection({ settings }: { settings: CaPageSettings }) {
  const m = money(settings);
  const kitItems = settings.kit.items.length ? settings.kit.items : DEFAULT_KIT_ITEMS;
  const rows = settings.statement.rows.length ? settings.statement.rows : DEFAULT_STATEMENT_ROWS;
  const footerLabel = settings.statement.footerLabel || DEFAULT_STATEMENT_FOOTER_LABEL;
  const footerAmount = settings.statement.footerAmount || DEFAULT_STATEMENT_FOOTER_AMOUNT;
  const t = (text: string) => resolveStatementText(text, m, kitItems);

  return (
    <section id="statement" className={styles.statement} aria-labelledby="ca-statement-title">
      <div className={styles.wrap}>
        <header className={styles.statementHead}>
          <h2 id="ca-statement-title" className={cn(styles.display, styles.sectionTitle)}>
            Your first months, line by line.
          </h2>
          <p className={styles.sectionSub}>
            What you do at each stage, and what lands in your account or your inbox.
          </p>
        </header>

        <div className={styles.sheet}>
          <div className={styles.sheetTop}>
            <div className={styles.sheetBrand}>
              <Image src="/logo.svg" alt="" width={133} height={38} />
              <p className={styles.sheetName}>Campus Ambassador statement</p>
            </div>
          </div>

          <table className={styles.ledger}>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What happens</th>
                <th scope="col">You get</th>
                <th scope="col" className={styles.thCredit}>
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.when}-${i}`}>
                  <td className={styles.cWhen}>
                    <span className={styles.when}>{t(row.when)}</span>
                  </td>
                  <td className={styles.cWhat}>{t(row.what)}</td>
                  <td className={styles.cGet}>
                    <ul className={styles.gets}>
                      {row.gets.map((get, gi) =>
                        get.icon === "none" ? (
                          <li key={`${get.title}-${gi}`} className={cn(styles.get, styles.getQuiet)}>
                            {t(get.title)}
                          </li>
                        ) : (
                          <li key={`${get.title}-${gi}`} className={styles.get}>
                            <Icon name={get.icon} />
                            <span>
                              {t(get.title)}
                              {get.note && <small>{t(get.note)}</small>}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </td>
                  <td className={styles.cCredit}>
                    {row.credit && (
                      <span className={cn(styles.num, styles.credit)}>
                        {row.credit.prefix && <small>{t(row.credit.prefix)}</small>}
                        {t(row.credit.amount)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <span className={styles.footLabel}>{t(footerLabel)}</span>
                  <br />
                  <span className={styles.footSub}>
                    Your {inr(m.stipend)} stipend plus the full {inr(m.incentiveCap)} incentive
                  </span>
                </td>
                <td className={styles.footAmount}>
                  <span className={styles.num}>{t(footerAmount)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
