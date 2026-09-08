"use client";
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

type EditorProps = {
  title?: string;
  placeholder?: string;
  required?: boolean;
  initialHtml?: string;
  modules?: any;
  className?: string;
  error?: string;
  height?: string | number;
  rows?: number;
  minLength?: number;
  maxLength?: number;
  showWordCount?: boolean;
  onChange?: (html: string) => void;
};

export interface EditorHandle {
  getHTML: () => string;
  setHTML: (html: string) => void;
  getText: () => string;
  isEmpty: () => boolean;
  getCharacterCount: () => number;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ 
    title, 
    placeholder = "Start typing...", 
    required = false,
    initialHtml = "", 
    modules,
    className,
    error,
    height,
    rows = 4,
    minLength,
    maxLength,
    showWordCount = false,
    onChange
  }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<Quill | null>(null);
    const [characterCount, setCharacterCount] = useState(0);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    /** The HTML last written in or reported out, so content the parent echoes
     *  back is not pasted over the caret while someone is typing. */
    const lastAppliedRef = useRef(initialHtml);

    // Calculate height based on rows or use provided height
    const calculateHeight = () => {
      if (height) {
        return typeof height === "number" ? `${height}px` : height;
      }
      // Default line height is approximately 20px, add some padding
      const lineHeight = 20;
      const padding = 40; // Account for toolbar and padding
      return `${rows * lineHeight + padding}px`;
    };

    // Calculate character count and validation states
    const getCharacterCount = (text: string) => {
      if (!text) return 0;
      // Remove any HTML tags and normalize whitespace
      const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      return cleanText.length;
    };

    const isMinLengthMet = minLength ? characterCount >= minLength : true;
    const isMaxLengthExceeded = maxLength ? characterCount > maxLength : false;

    const applyHtml = (html: string) => {
      const quill = quillRef.current;
      if (!quill || html === lastAppliedRef.current) return;
      quill.clipboard.dangerouslyPasteHTML(html || "");
      lastAppliedRef.current = html;
      setCharacterCount(getCharacterCount(quill.getText()));
    };

    useEffect(() => {
      if (!containerRef.current || quillRef.current) return;

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        placeholder,
        modules: modules ?? {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
          ],
        },
      });
      quillRef.current = quill;

      if (initialHtml) {
        quill.clipboard.dangerouslyPasteHTML(initialHtml);
      }
      lastAppliedRef.current = initialHtml;
      setCharacterCount(getCharacterCount(quill.getText()));

      const handleTextChange = (
        _delta: unknown,
        _oldDelta: unknown,
        source: string,
      ) => {
        const html = quill.root.innerHTML;
        setCharacterCount(getCharacterCount(quill.getText()));
        // Seeding and programmatic writes are not edits. Reporting them would
        // hand the parent a change nobody made, which reads as unsaved work.
        if (source !== "user") return;
        lastAppliedRef.current = html;
        onChangeRef.current?.(html);
      };
      quill.on("text-change", handleTextChange);

      return () => {
        quill.off("text-change", handleTextChange);
        quillRef.current = null;
      };
      // Seeded once: `initialHtml` is a starting value, not a bound one, and
      // re-running this would drop the live instance the toolbar is wired to.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      applyHtml(initialHtml);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialHtml]);

    useImperativeHandle(ref, () => ({
      getHTML: () => quillRef.current?.root.innerHTML || "",
      setHTML: (html: string) => applyHtml(html),
      getText: () => quillRef.current?.getText() || "",
      isEmpty: () => {
        if (!quillRef.current) return true;
        const text = quillRef.current.getText();
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        return cleanText.length === 0;
      },
      getCharacterCount: () => characterCount,
    }));

     return (
       <>
         <style jsx global>{`
           .ql-editor {
             word-wrap: break-word;
             overflow-wrap: break-word;
             white-space: pre-wrap;
             max-width: 100%;
             box-sizing: border-box;
           }
           .ql-container {
             max-width: 100%;
             overflow-x: hidden;
           }
         `}</style>
         <div className={cn("w-full", className)}>
           {title && (
             <label className="block text-sm font-medium text-gray-700 mb-2">
               {title}
               {required && <span className="text-red-500 ml-1">*</span>}
             </label>
           )}
           <div className="relative">
             <div 
               className={cn(
                 "border rounded-lg overflow-hidden",
                 error || isMaxLengthExceeded ? "border-red-500" : 
                 !isMinLengthMet ? "border-orange-500" : 
                 "border-gray-300 focus-within:border-blue-500"
               )}
             >
               <div 
                 ref={containerRef} 
                 style={{ 
                   height: calculateHeight(),
                   ...(showWordCount && { paddingBottom: "32px" })
                 }}
                 className="focus-within:outline-none"
               />
             </div>
          {showWordCount && (
            <div className="absolute bottom-2 right-3 text-xs bg-white px-1 rounded">
              <div className={cn(
                "text-right",
                isMaxLengthExceeded ? "text-red-500" : 
                !isMinLengthMet ? "text-orange-500" : 
                "text-gray-500"
              )}>
                {characterCount}
                {maxLength && `/${maxLength}`}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        {minLength && !isMinLengthMet && characterCount > 0 && (
          <div className="text-xs text-orange-500 mt-1">
            Minimum {minLength} characters required ({minLength - characterCount} more needed)
          </div>
        )}
        {maxLength && isMaxLengthExceeded && (
          <div className="text-xs text-red-500 mt-1">
            Maximum {maxLength} characters exceeded (remove {characterCount - maxLength} characters)
          </div>
         )}
         </div>
       </>
     );
   }
 );

Editor.displayName = "Editor";
export default Editor;
