"use client";

import { useCallback, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import {
  downloadInternshipQuestionBankTemplate,
  parseInternshipQuestionsWorkbook,
  type InternshipQuestionCreateBody,
} from "@/lib/internshipQuestionBankXlsx";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function QuestionExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [fileLabel, setFileLabel] = useState("");
  const [questions, setQuestions] = useState<InternshipQuestionCreateBody[]>(
    [],
  );
  const [parseErrors, setParseErrors] = useState<
    { excelRow: number; message: string }[]
  >([]);
  const [importing, setImporting] = useState(false);

  const reset = useCallback(() => {
    setFileLabel("");
    setQuestions([]);
    setParseErrors([]);
    setImporting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onPickFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      setFileLabel(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const buf = reader.result;
          if (!(buf instanceof ArrayBuffer)) {
            toast.error("Could not read file");
            return;
          }
          const { questions: q, errors } = parseInternshipQuestionsWorkbook(buf);
          setQuestions(q);
          setParseErrors(errors);
          if (errors.length > 0 && q.length === 0) {
            toast.error(`${errors.length} row(s) could not be parsed`);
          } else if (errors.length > 0) {
            toast.warning(
              `Parsed ${q.length} question(s); ${errors.length} row(s) skipped (see list)`,
            );
          } else {
            toast.success(`Parsed ${q.length} question(s)`);
          }
        } catch {
          toast.error("Invalid Excel file");
          setQuestions([]);
          setParseErrors([]);
        }
      };
      reader.onerror = () => toast.error("Failed to read file");
      reader.readAsArrayBuffer(file);
    },
    [],
  );

  const runImport = async () => {
    if (questions.length === 0) {
      toast.error("No valid questions to import");
      return;
    }
    setImporting(true);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipQuestions.adminBulkCreate,
        { questions },
        { timeout: 120_000 },
      );
      const data = res.data?.data as {
        created?: number;
        failed?: { index: number; message: string }[];
        ids?: string[];
      };
      const created = data?.created ?? 0;
      const failed = data?.failed ?? [];
      if (failed.length > 0) {
        toast.warning(
          `Saved ${created} question(s). ${failed.length} failed validation on server.`,
        );
      } else {
        toast.success(`Imported ${created} question(s)`);
      }
      onSuccess();
      handleClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Import failed";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import questions from Excel">
      <div className="flex flex-col gap-4 max-w-lg">
        <p className="text-sm text-gray-600">
          <strong>Row 1</strong>: headers. <strong>From row 2</strong>: data.
          Only the <strong>first sheet</strong> is used. File is parsed in the
          browser, then sent to the server.{" "}
          <a
            href="/templates/internship-question-bank-template.xlsx"
            className="text-primary font-semibold underline underline-offset-2"
            download
          >
            Template (.xlsx)
          </a>
        </p>

        <div className="flex flex-wrap gap-2">
          <WhiteButton
            type="button"
            glow={false}
            className="inline-flex items-center gap-2"
            onClick={() => downloadInternshipQuestionBankTemplate()}
          >
            <Download className="size-4" />
            Download template
          </WhiteButton>
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-gray-50">
            <Upload className="size-4" />
            {fileLabel || "Choose .xlsx"}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                onPickFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {questions.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950 flex items-center gap-2">
            <FileSpreadsheet className="size-4 shrink-0" />
            <span>
              <strong>{questions.length}</strong> question
              {questions.length === 1 ? "" : "s"} ready to import
            </span>
          </div>
        )}

        {parseErrors.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-amber-950 mb-1">
              Skipped / invalid rows
            </p>
            <ul className="text-xs text-amber-900 space-y-1">
              {parseErrors.map((err, i) => (
                <li key={i}>
                  Row {err.excelRow}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <WhiteButton type="button" glow={false} onClick={handleClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={questions.length === 0 || importing}
            className="inline-flex items-center gap-2 min-w-[120px] justify-center"
            onClick={() => void runImport()}
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {importing ? "Importing…" : "Import"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
