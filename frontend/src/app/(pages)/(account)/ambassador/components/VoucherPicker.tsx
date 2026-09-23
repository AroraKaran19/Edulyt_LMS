"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { AlertCircle, ArrowLeft, Search, SearchX, X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import { useCaVoucher } from "@/hooks/useCaVouchers";
import type { CaVoucherCourseOption, CaVoucherCoursesPage } from "@/types/ca-voucher";
import { CourseThumb, PLAN_LABEL, PlanPill } from "./VoucherBits";
import s from "../desk.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Resolves true once the request is sent. */
  onRequest: (course: CaVoucherCourseOption) => Promise<boolean>;
}

/** Native modal dialog: the browser supplies the focus trap, inert page and Esc. */
export default function VoucherPicker({ open, onClose, onRequest }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <dialog ref={ref} className={s.picker} aria-labelledby="voucher-picker-title" onCancel={onCancel} onClick={onBackdrop}>
      {open ? <PickerBody onClose={onClose} onRequest={onRequest} /> : null}
    </dialog>
  );
}

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; data: CaVoucherCoursesPage };

function PickerBody({ onClose, onRequest }: Omit<Props, "open">) {
  const { listCourses } = useCaVoucher();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; load: Load } | null>(null);
  const [selected, setSelected] = useState<CaVoucherCourseOption | null>(null);
  const [sending, setSending] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confirmTitleRef = useRef<HTMLHeadingElement>(null);
  const lastPickedId = useRef<string | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchKey = `${attempt}|${page}|${query}`;
  const load: Load = loaded?.key === fetchKey ? loaded.load : { state: "loading" };

  useEffect(() => {
    const controller = new AbortController();
    listCourses(query, page, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setLoaded({ key: fetchKey, load: data ? { state: "ready", data } : { state: "error" } });
    });
    return () => controller.abort();
  }, [listCourses, query, page, fetchKey]);

  useEffect(() => {
    if (selected) {
      confirmTitleRef.current?.focus();
    } else if (lastPickedId.current) {
      scrollRef.current?.querySelector<HTMLElement>(`[data-course-id="${lastPickedId.current}"]`)?.focus();
    }
  }, [selected]);

  const goToPage = (next: number) => {
    setPage(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const pick = (course: CaVoucherCourseOption) => {
    lastPickedId.current = course.id;
    setSelected(course);
  };

  const send = async () => {
    if (!selected || sending) return;
    setSending(true);
    const ok = await onRequest(selected);
    if (!ok) setSending(false);
  };

  return (
    <div className={s.pickerInner}>
      <header className={s.pickerHead}>
        <h2 id="voucher-picker-title" className={cn(s.display, s.pickerTitle)}>
          {selected ? "Confirm your course" : "Choose your course"}
        </h2>
        <button type="button" className={s.pickerClose} onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </header>

      {selected ? (
        <div className={s.pickerScroll}>
          <div className={s.confirm}>
            <button type="button" className={s.backLink} onClick={() => setSelected(null)} disabled={sending}>
              <ArrowLeft aria-hidden="true" />
              All courses
            </button>
            <div className={s.confirmThumb}>
              <CourseThumb course={selected} sizes="(max-width: 640px) 100vw, 560px" />
            </div>
            <PlanPill plan={selected.plan} />
            <h3 ref={confirmTitleRef} tabIndex={-1} className={cn(s.display, s.confirmTitle)}>
              Request {selected.title}?
            </h3>
            <p className={s.confirmNote}>
              You get the <b>{PLAN_LABEL[selected.plan]}</b> plan. An admin reviews your request before the course
              unlocks.
            </p>
            <div className={s.confirmActions}>
              <OrangeButton className={cn(s.btn, s.btnOrange)} onClick={() => void send()} disabled={sending}>
                {sending ? "Sending..." : "Send request"}
              </OrangeButton>
              <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={() => setSelected(null)} disabled={sending}>
                Pick another
              </WhiteButton>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={s.pickerSearch}>
            <Search className={s.pickerSearchIc} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setQuery(search.trim());
                  setPage(1);
                }
              }}
              placeholder="Search courses"
              aria-label="Search courses"
              className={s.pickerInput}
            />
          </div>
          <div ref={scrollRef} className={s.pickerScroll} aria-busy={load.state === "loading"}>
            <CourseResults
              load={load}
              query={query}
              onPick={pick}
              onRetry={() => setAttempt((n) => n + 1)}
              onClear={() => {
                setSearch("");
                setQuery("");
                setPage(1);
                searchRef.current?.focus();
              }}
            />
            {load.state === "ready" ? (
              <Pagination
                page={load.data.page}
                totalPages={load.data.totalPages}
                onPageChange={goToPage}
                windowSize={3}
                className={cn(s.deskPager, s.pickerPager)}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

interface ResultsProps {
  load: Load;
  query: string;
  onPick: (course: CaVoucherCourseOption) => void;
  onRetry: () => void;
  onClear: () => void;
}

function CourseResults({ load, query, onPick, onRetry, onClear }: ResultsProps) {
  if (load.state === "loading") {
    return (
      <ul className={s.courseGrid} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className={s.courseSkel}>
            <span className={cn(s.skel, s.courseSkelThumb)} />
            <span className={s.courseMeta}>
              <span className={s.skel} style={{ height: 14, width: "90%" }} />
              <span className={s.skel} style={{ height: 14, width: "60%" }} />
              <span className={s.skel} style={{ height: 22, width: 64, borderRadius: 99 }} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (load.state === "error") {
    return (
      <div className={s.empty} role="alert">
        <span className={cn(s.emptyIc, s.errorIc)}>
          <AlertCircle aria-hidden="true" />
        </span>
        <h3>We couldn&apos;t load the courses</h3>
        <p>Check your connection and try again.</p>
        <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={onRetry}>
          Try again
        </WhiteButton>
      </div>
    );
  }

  if (load.data.courses.length === 0) {
    return query ? (
      <div className={s.empty} role="status">
        <span className={s.emptyIc}>
          <SearchX aria-hidden="true" />
        </span>
        <h3>No courses match &ldquo;{query}&rdquo;</h3>
        <p>Try a shorter or different word.</p>
        <WhiteButton className={cn(s.btn, s.btnWhite)} onClick={onClear}>
          Clear search
        </WhiteButton>
      </div>
    ) : (
      <div className={s.empty} role="status">
        <span className={s.emptyIc}>
          <SearchX aria-hidden="true" />
        </span>
        <h3>No courses to choose from right now</h3>
      </div>
    );
  }

  return (
    <ul className={s.courseGrid}>
      {load.data.courses.map((course) => (
        <li key={course.id}>
          <button type="button" className={s.courseCard} data-course-id={course.id} onClick={() => onPick(course)}>
            <span className={s.courseThumb}>
              <CourseThumb course={course} sizes="(max-width: 640px) 50vw, 180px" />
            </span>
            <span className={s.courseMeta}>
              <span className={cn(s.courseName, s.clamp2)}>{course.title}</span>
              <PlanPill plan={course.plan} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
