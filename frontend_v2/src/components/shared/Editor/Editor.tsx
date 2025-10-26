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
    const initializedRef = useRef(false);
    const [characterCount, setCharacterCount] = useState(0);

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

    // Update character count when text changes
    const updateCharacterCount = () => {
      if (quillRef.current) {
        const text = quillRef.current.getText();
        const html = quillRef.current.root.innerHTML;
        const count = getCharacterCount(text);
        
        setCharacterCount(count);
        
        // Call onChange with HTML content
        if (onChange) {
          onChange(html);
        }
      }
    };

    useEffect(() => {
      if (containerRef.current && !quillRef.current && !initializedRef.current) {
        quillRef.current = new Quill(containerRef.current, {
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

        if (initialHtml) {
          quillRef.current.clipboard.dangerouslyPasteHTML(initialHtml);
        }

        // Add text change listener
        const quillInstance = quillRef.current;
        quillInstance.on('text-change', () => {
          // Get the complete text content from the current editor state
          const text = quillInstance.getText();
          const html = quillInstance.root.innerHTML;
          const count = getCharacterCount(text);
          
          setCharacterCount(count);
          
          // Call onChange with HTML content
          if (onChange) {
            onChange(html);
          }
        });
        
        // Set initial character count after a small delay to ensure content is loaded
        setTimeout(() => {
          if (quillRef.current) {
            const text = quillRef.current.getText();
            const html = quillRef.current.root.innerHTML;
            const count = getCharacterCount(text);
            
            setCharacterCount(count);
            
            if (onChange) {
              onChange(html);
            }
          }
        }, 100);
        
        initializedRef.current = true;
      }

      return () => {
        if (quillRef.current) {
          quillRef.current.off('text-change', updateCharacterCount);
        }
        quillRef.current = null;
      };
    }, [initialHtml, modules, placeholder]);

    // Update character count when initialHtml changes
    useEffect(() => {
      if (quillRef.current && initialHtml) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialHtml);
        setTimeout(() => {
          updateCharacterCount();
        }, 100);
      }
    }, [initialHtml]);

    useImperativeHandle(ref, () => ({
      getHTML: () => quillRef.current?.root.innerHTML || "",
      setHTML: (html: string) => {
        if (quillRef.current) {
          quillRef.current.clipboard.dangerouslyPasteHTML(html);
          setTimeout(() => {
            updateCharacterCount();
          }, 100);
        }
      },
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
