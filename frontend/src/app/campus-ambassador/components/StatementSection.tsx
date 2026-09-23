import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CaPageSettings } from "@/types/ca-page-settings";
import styles from "../ca.module.css";
import { DEFAULT_KIT_ITEMS, inr, money, statementRows } from "../content";
import { formatYmd } from "./formSteps";
import Icon from "./Icon";

export default function StatementSection({ settings }: { settings: CaPageSettings }) {
  const m = money(settings);
  const rows = statementRows(m, settings.kit.items.length ? settings.kit.items : DEFAULT_KIT_ITEMS);
  const { joiningDate, durationMonths, endDate } = settings.batch;

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
            {joiningDate && (
              <p className={styles.sheetMeta}>
                Batch joining {formatYmd(joiningDate)}
                <br />
                {durationMonths} {durationMonths === 1 ? "month" : "months"}
                {endDate ? `, ending ${formatYmd(endDate)}` : ""}
              </p>
            )}
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
              {rows.map((row) => (
                <tr key={row.when}>
                  <td className={styles.cWhen}>
                    <span className={styles.when}>{row.when}</span>
                  </td>
                  <td className={styles.cWhat}>{row.what}</td>
                  <td className={styles.cGet}>
                    <ul className={styles.gets}>
                      {row.gets.map((get) =>
                        get.kind === "quiet" ? (
                          <li key={get.title} className={cn(styles.get, styles.getQuiet)}>
                            {get.title}
                          </li>
                        ) : (
                          <li key={get.title} className={styles.get}>
                            <Icon name={get.icon} />
                            <span>
                              {get.title}
                              {get.note && <small>{get.note}</small>}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </td>
                  <td className={styles.cCredit}>
                    {row.credit && (
                      <span className={cn(styles.num, styles.credit)}>
                        {row.credit.prefix && <small>{row.credit.prefix}</small>}
                        {row.credit.amount}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <span className={styles.footLabel}>A top month</span>
                  <br />
                  <span className={styles.footSub}>
                    Your {inr(m.stipend)} stipend plus the full {inr(m.incentiveCap)} incentive
                  </span>
                </td>
                <td className={styles.footAmount}>
                  <span className={styles.num}>{inr(m.stipend + m.incentiveCap)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
