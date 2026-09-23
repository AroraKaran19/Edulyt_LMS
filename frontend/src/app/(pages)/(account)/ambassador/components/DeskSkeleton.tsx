import { cn } from "@/lib/utils";
import s from "../desk.module.css";

const Bar = ({ w, h, dark = false, r }: { w: string; h: number; dark?: boolean; r?: number }) => (
  <span className={cn(s.skel, dark && s.skelDark)} style={{ width: w, height: h, borderRadius: r }} />
);

export default function DeskSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className={s.srOnly}>Loading your desk</span>
      <div className={s.hero}>
        <div className={cn(s.wrap, s.heroGrid)}>
          <div className={s.skelStack}>
            <Bar dark w="min(560px, 90%)" h={56} r={14} />
            <Bar dark w="min(380px, 70%)" h={20} />
            <div className={s.tenure}>
              <Bar dark w="100%" h={8} r={99} />
            </div>
            <div className={s.share}>
              <Bar dark w="100%" h={46} r={14} />
            </div>
          </div>
          <div className={s.points}>
            <div className={s.skelStack}>
              <Bar dark w="140px" h={60} r={14} />
              <Bar dark w="90%" h={16} />
              <Bar dark w="100%" h={10} r={99} />
              <Bar dark w="100%" h={16} />
              <Bar dark w="100%" h={16} />
            </div>
          </div>
        </div>
      </div>
      <div className={s.wrap}>
        <ul className={s.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className={s.tile}>
              <div className={s.skelStack}>
                <Bar w="72px" h={36} />
                <Bar w="80%" h={14} />
              </div>
            </li>
          ))}
        </ul>
        <div className={s.section}>
          <Bar w="min(420px, 80%)" h={36} r={12} />
          <div className={s.grid2}>
            <div className={s.card}>
              <div className={s.skelStack}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <Bar w="44px" h={44} r={14} />
                    <div className={s.skelStack} style={{ flex: 1, gap: 8 }}>
                      <Bar w="75%" h={16} />
                      <Bar w="45%" h={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Bar w="100%" h={180} r={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
