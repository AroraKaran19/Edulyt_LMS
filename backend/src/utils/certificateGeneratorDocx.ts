import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";
import { DOMParser, XMLSerializer } from "xmldom";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";

/**
 * Certificate Generator using DOCX Templates
 *
 * This generator replaces placeholders in DOCX templates and converts to PDF.
 * The template uses square brackets [] for placeholders like [Full Name], [Course Name], etc.
 *
 * Fields like Full Name, Course Name, and Key Topics will be formatted in bold.
 */

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  instructorName?: string;
  keyTopics?: string; // Key topics or technologies
  verificationUrl?: string; // URL for QR code verification
  // Internship-certificate-only fields (ignored by the course-cert template):
  // Real allotted intern ID (e.g. "AI-00042"), matching the offer letter. When
  // set it fills the template's "AI-XXXX" / "Intern ID" placeholder instead of
  // the internal certificateId hash — see `printedId` below.
  internId?: string;
  internRole?: string; // Designation, e.g. "Data Analytics Intern"
  internDurationMonths?: string; // Number of months, e.g. "3"
  internPeriod?: string; // Period text, e.g. "01 - Jul - 2026 to 30 - Sep - 2026"
}

/**
 * Resolve the descriptive placeholders the Airkrit templates use but that have
 * no direct data key: gender pronouns and the internship role/duration/period.
 * Used as docxtemplater's nullGetter so an unmapped tag never renders the
 * literal string "undefined" (docxtemplater's default) — it resolves to a
 * sensible value, or "" as a last resort.
 *
 * Pronouns are gender-neutral ("they/them/their") because no gender is stored
 * on users; the capitalized template variants (e.g. "[His/Her]") map to the
 * capitalized neutral form ("Their").
 */
function makeFieldNullGetter(data: CertificateData) {
  return (part: any): string => {
    // Leave module tags (image/loops) for their own modules to resolve.
    if (part && part.module) return "";
    const tag = String(part?.value ?? "").trim();
    const lower = tag.toLowerCase();
    const capitalized = /^[A-Z]/.test(tag);
    if (lower === "he/she") return capitalized ? "They" : "they";
    if (lower === "him/her") return capitalized ? "Them" : "them";
    if (lower === "his/her") return capitalized ? "Their" : "their";
    if (lower.includes("domain")) return data.internRole ?? "";
    if (tag === "X") return data.internDurationMonths ?? "";
    if (/dd\s*-\s*mmm/.test(lower)) return data.internPeriod ?? "";
    return "";
  };
}

/**
 * Post-process the DOCX XML to replace plain text placeholders that weren't caught by docxtemplater
 * This handles cases where the template has plain text like "DD-MM-YYYY" instead of "[DD-MM-YYYY]"
 */
export function replacePlainTextPlaceholders(
  zip: PizZip,
  replacements: { [key: string]: string }
): void {
  try {
    // Get the main document XML
    const docXml = zip.files["word/document.xml"];
    if (!docXml) {
      throw new Error("document.xml not found in DOCX");
    }

    const xmlContent = docXml.asText();

    // Parse the XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");

    // Define namespaces
    const ns = {
      w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    };

    // Helper function to get elements by tag name with namespace
    const getElementsByTagNameNS = (
      node: any,
      namespace: string,
      localName: string
    ): any[] => {
      const result: any[] = [];
      const traverse = (n: any) => {
        if (
          n.nodeType === 1 &&
          n.namespaceURI === namespace &&
          n.localName === localName
        ) {
          result.push(n);
        }
        if (n.childNodes) {
          for (let i = 0; i < n.childNodes.length; i++) {
            traverse(n.childNodes[i]);
          }
        }
      };
      traverse(node);
      return result;
    };

    const paragraphs = getElementsByTagNameNS(doc, ns.w, "p");
    paragraphs.forEach((paragraph: any) => {
      // Re-scan the paragraph after each replacement so shifting offsets can't
      // corrupt a later match. Bounded to defensively avoid any infinite loop.
      for (let guard = 0; guard < 200; guard++) {
        const tNodes = getElementsByTagNameNS(paragraph, ns.w, "t");
        if (tNodes.length === 0) break;

        const segments: string[] = tNodes.map((n: any) => n.textContent || "");
        const starts: number[] = [];
        let acc = 0;
        for (const s of segments) {
          starts.push(acc);
          acc += s.length;
        }
        const full = segments.join("");

        // Pick the earliest-occurring placeholder in this paragraph.
        let match: { rep: string; pos: number; len: number } | null = null;
        for (const [placeholder, replacement] of Object.entries(replacements)) {
          const pos = full.indexOf(placeholder);
          if (pos !== -1 && (match === null || pos < match.pos)) {
            match = { rep: replacement, pos, len: placeholder.length };
          }
        }
        if (!match) break;

        const end = match.pos + match.len; // exclusive
        // First run containing the start of the match, last run containing its end.
        let a = 0;
        while (a < segments.length - 1 && starts[a] + segments[a].length <= match.pos) a++;
        let b = a;
        while (b < segments.length - 1 && starts[b] + segments[b].length <= end - 1) b++;

        const prefix = segments[a].slice(0, match.pos - starts[a]);
        const suffix = segments[b].slice(end - starts[b]);
        if (a === b) {
          tNodes[a].textContent = prefix + match.rep + suffix;
        } else {
          tNodes[a].textContent = prefix + match.rep;
          for (let i = a + 1; i < b; i++) tNodes[i].textContent = "";
          tNodes[b].textContent = suffix;
        }
      }
    });

    // Serialize back to XML string
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(doc);

    // Update the document.xml in the zip
    zip.file("word/document.xml", updatedXml);
  } catch (error: any) {
    console.error("Error replacing plain text placeholders:", error);
    // Don't throw - continue without replacement if it fails
  }
}

/**
 * Insert QR code image into DOCX document at bottom right
 * This function adds the QR code image to the document and positions it
 */
// QR code insertion function removed - caused DOCX corruption
// TODO: Re-implement with proper DOCX XML handling if needed

/**
 * Post-process the DOCX XML to apply bold formatting to text between markers
 * This function finds text wrapped in markers, applies bold formatting, and removes the markers
 */
function applyBoldFormattingWithMarkers(
  zip: PizZip,
  startMarker: string,
  endMarker: string
): void {
  try {
    // Get the main document XML
    const docXml = zip.files["word/document.xml"];
    if (!docXml) {
      throw new Error("document.xml not found in DOCX");
    }

    const xmlContent = docXml.asText();

    // Parse the XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");

    // Define namespaces
    const ns = {
      w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    };

    // Helper function to get elements by tag name with namespace
    const getElementsByTagNameNS = (
      node: any,
      namespace: string,
      localName: string
    ): any[] => {
      const result: any[] = [];
      const traverse = (n: any) => {
        if (
          n.nodeType === 1 &&
          n.namespaceURI === namespace &&
          n.localName === localName
        ) {
          result.push(n);
        }
        if (n.childNodes) {
          for (let i = 0; i < n.childNodes.length; i++) {
            traverse(n.childNodes[i]);
          }
        }
      };
      traverse(node);
      return result;
    };

    // Find all text nodes (w:t elements)
    const textNodes = getElementsByTagNameNS(doc, ns.w, "t");

    // Collect runs that need to be processed (to avoid modifying while iterating)
    const runsToProcess: Array<{
      runNode: any;
      textNode: any;
      textContent: string;
      preserveSpace: boolean;
      originalRPr: any; // Original run properties to preserve font-size, etc.
    }> = [];

    textNodes.forEach((textNode: any) => {
      const textContent = textNode.textContent || "";

      // Check if this text node contains our markers
      if (
        textContent.includes(startMarker) &&
        textContent.includes(endMarker)
      ) {
        // Get the parent run (w:r)
        let runNode: any = textNode.parentNode;
        while (
          runNode &&
          (runNode.localName !== "r" || runNode.namespaceURI !== ns.w)
        ) {
          runNode = runNode.parentNode;
        }

        if (runNode) {
          // Get original run properties (rPr) to preserve font-size, font-family, etc.
          let originalRPr: any = null;
          const runChildren = runNode.childNodes || [];
          for (let i = 0; i < runChildren.length; i++) {
            const child = runChildren[i];
            if (
              child.nodeType === 1 &&
              child.localName === "rPr" &&
              child.namespaceURI === ns.w
            ) {
              originalRPr = child;
              break;
            }
          }

          // Check if original text node has xml:space="preserve"
          const preserveSpace =
            textNode.getAttribute("xml:space") === "preserve";
          runsToProcess.push({
            runNode,
            textNode,
            textContent,
            preserveSpace,
            originalRPr,
          });
        }
      }
    });

    // Process each run that contains markers
    runsToProcess.forEach(
      ({ runNode, textNode, textContent, preserveSpace, originalRPr }) => {
        const parentNode = runNode.parentNode;
        if (!parentNode) return;

        // Parse text to extract parts (normal text and bold text)
        const parts: Array<{ text: string; shouldBold: boolean }> = [];
        let remainingText = textContent;
        let currentIndex = 0;

        while (currentIndex < remainingText.length) {
          const startIndex = remainingText.indexOf(startMarker, currentIndex);

          if (startIndex === -1) {
            // No more markers, add remaining text
            if (currentIndex < remainingText.length) {
              const remaining = remainingText.substring(currentIndex);
              if (remaining) {
                parts.push({ text: remaining, shouldBold: false });
              }
            }
            break;
          }

          // Add text before marker
          if (startIndex > currentIndex) {
            const beforeText = remainingText.substring(
              currentIndex,
              startIndex
            );
            if (beforeText) {
              parts.push({ text: beforeText, shouldBold: false });
            }
          }

          // Find end marker
          const endIndex = remainingText.indexOf(
            endMarker,
            startIndex + startMarker.length
          );
          if (endIndex === -1) {
            // No end marker found, treat rest as normal text
            const rest = remainingText.substring(startIndex);
            if (rest) {
              parts.push({ text: rest, shouldBold: false });
            }
            break;
          }

          // Extract text between markers (this should be bold)
          const boldText = remainingText.substring(
            startIndex + startMarker.length,
            endIndex
          );
          if (boldText) {
            parts.push({ text: boldText, shouldBold: true });
          }

          currentIndex = endIndex + endMarker.length;
        }

        // If no parts were found, skip
        if (parts.length === 0) return;

        // Store the next sibling for insertion
        const nextSibling = runNode.nextSibling;

        // Remove the original run
        parentNode.removeChild(runNode);

        // Create new runs for each part
        parts.forEach((part) => {
          if (!part.text) return; // Skip empty parts

          const newRun = doc.createElementNS(ns.w, "w:r");

          // Always create rPr to preserve font properties (font-size, font-family, etc.)
          const rPr = doc.createElementNS(ns.w, "w:rPr");

          // Copy all properties from original rPr (font-size, font-family, color, etc.)
          if (originalRPr) {
            const originalChildren = originalRPr.childNodes || [];
            for (let i = 0; i < originalChildren.length; i++) {
              const child = originalChildren[i];
              if (child.nodeType === 1) {
                // Clone the node (font-size, font-family, color, etc.)
                const clonedChild = child.cloneNode(true);
                rPr.appendChild(clonedChild);
              }
            }
          }

          // Add or update bold property
          if (part.shouldBold) {
            // Check if bold already exists, if not add it
            let hasBold = false;
            const rPrChildren = rPr.childNodes || [];
            for (let i = 0; i < rPrChildren.length; i++) {
              const child = rPrChildren[i];
              if (
                child.nodeType === 1 &&
                child.localName === "b" &&
                child.namespaceURI === ns.w
              ) {
                hasBold = true;
                break;
              }
            }
            if (!hasBold) {
              const bold = doc.createElementNS(ns.w, "w:b");
              rPr.appendChild(bold);
            }
          } else {
            // Remove bold if it exists (for non-bold parts)
            const rPrChildren = rPr.childNodes || [];
            for (let i = rPrChildren.length - 1; i >= 0; i--) {
              const child = rPrChildren[i];
              if (
                child.nodeType === 1 &&
                child.localName === "b" &&
                child.namespaceURI === ns.w
              ) {
                rPr.removeChild(child);
              }
            }
          }

          // Only add rPr if it has children (properties)
          if (rPr.childNodes && rPr.childNodes.length > 0) {
            newRun.appendChild(rPr);
          }

          const newTextNode = doc.createElementNS(ns.w, "w:t");
          // Preserve spaces in text nodes if original had it
          if (preserveSpace) {
            newTextNode.setAttribute("xml:space", "preserve");
          }
          newTextNode.textContent = part.text;
          newRun.appendChild(newTextNode);

          // Insert the new run
          if (nextSibling) {
            parentNode.insertBefore(newRun, nextSibling);
          } else {
            parentNode.appendChild(newRun);
          }
        });
      }
    );

    // Serialize back to XML string
    const serializer = new XMLSerializer();
    const updatedXml = serializer.serializeToString(doc);

    // Update the document.xml in the zip
    zip.file("word/document.xml", updatedXml);
  } catch (error: any) {
    console.error("Error applying bold formatting:", error);
    // Don't throw - continue without bold formatting if it fails
  }
}

/**
 * Generate certificate from DOCX template
 * Replaces placeholders and returns the modified DOCX buffer
 *
 * Template placeholders should use square brackets: [Placeholder Name]
 * Supported placeholders:
 * - [DD-MM-YYYY] or [Date] or [Completion Date] - for the completion date
 * - [AI-XXXX] or [ID : AI-XXXX] or [Certificate ID] or [ID] - for the certificate ID
 * - [Full Name] - for student name (bold)
 * - [Your Name] - for student name (not bold, used in greeting)
 * - [Course Name] - for course name (bold)
 * - [Key Topics or Technologies] - for key topics (bold)
 */
export async function generateCertificateFromDocx(
  templatePath: string,
  outputPath: string,
  data: CertificateData
): Promise<Buffer> {
  try {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    // Read the DOCX file
    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    // Generate QR code if verification URL is provided
    let qrCodeBuffer: Buffer | null = null;
    if (data.verificationUrl) {
      try {
        qrCodeBuffer = await QRCode.toBuffer(data.verificationUrl, {
          type: "png",
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        console.log(`[Certificate] QR code generated for: ${data.verificationUrl}`);
      } catch (error) {
        console.error("[Certificate] Error generating QR code:", error);
        // Continue without QR code
      }
    }

    // Configure ImageModule for QR code insertion
    const imageModule = new ImageModule({
      centered: false,
      getImage(tagValue: string) {
        // Return QR code buffer when [qrImage] placeholder is found
        if (tagValue === "qrImage" && qrCodeBuffer) {
          return qrCodeBuffer;
        }
        return Buffer.from(""); // Return empty buffer if no QR code
      },
      getSize() {
        // Size: 1 inch at 96 DPI = 96 pixels (smaller to prevent page break)
        return [96, 96];
      },
    });

    // Configure docxtemplater with custom delimiters to use [] instead of {{}}
    // Enable modules for rich text support and image insertion
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "[",
        end: "]",
      },
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule], // Add image module for QR code
      // Resolve pronouns + internship role/duration/period, and ensure no tag
      // ever renders the literal "undefined" (docxtemplater's default).
      nullGetter: makeFieldNullGetter(data),
    });

    // Prepare data for replacement
    // Use unique markers for text that should be bold, so we can identify and format them later
    const BOLD_MARKER_PREFIX = "___BOLD_START___";
    const BOLD_MARKER_SUFFIX = "___BOLD_END___";

    const formattedDate = formatDateDDMMYYYY(data.completionDate);

    // The ID printed into the "AI-XXXX" placeholder: the real intern ID for
    // internship certificates (so it matches the offer letter), the internal
    // certificateId hash otherwise. `internId` already carries the "AI-" prefix.
    const printedId = data.internId ?? data.certificateId;

    const templateData: any = {
      "Your Name": data.studentName, // Not bold (used in greeting)
      "Full Name": `${BOLD_MARKER_PREFIX}${data.studentName}${BOLD_MARKER_SUFFIX}`, // Will be made bold
      // The LOR template closes with "We fully endorse [Name] ...".
      Name: `${BOLD_MARKER_PREFIX}${data.studentName}${BOLD_MARKER_SUFFIX}`,
      "Course Name": `${BOLD_MARKER_PREFIX}${data.courseName}${BOLD_MARKER_SUFFIX}`, // Will be made bold
      "Key Topics or Technologies": `${BOLD_MARKER_PREFIX}${
        data.keyTopics || "the course topics"
      }${BOLD_MARKER_SUFFIX}`, // Will be made bold
      // Date format: DD-MM-YYYY (will be made bold)
      // Support multiple variations
      "DD-MM-YYYY": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      Date: `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      "Completion Date": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      // Certificate ID (will be made bold)
      // Support multiple variations including "ID : AI-XXXX" format
      "AI-XXXX": `${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      "ID : AI-XXXX": `ID : ${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      "Certificate ID": `${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      ID: `${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      // QR Code placeholder - will be replaced by ImageModule if QR code exists
      qrImage: qrCodeBuffer ? "qrImage" : "", // Empty string if no QR code
    };

    // Render the document (replace placeholders with marked text)
    try {
      doc.render(templateData);
    } catch (renderError: any) {
      // Log template data keys for debugging
      console.log("Available template data keys:", Object.keys(templateData));
      if (renderError.properties && renderError.properties.errors) {
        console.error(
          "Template rendering errors:",
          renderError.properties.errors
        );
      }
      throw renderError;
    }

    // Post-process: Replace any plain text placeholders that weren't caught by docxtemplater
    // This handles cases where the template has "DD-MM-YYYY" instead of "[DD-MM-YYYY]"
    // Also handles certificate ID placeholders like "AI-XXXX" or "ID : AI-XXXX"
    // Order matters: replace longer strings first to avoid partial replacements
    const plainTextReplacements: { [key: string]: string } = {
      "ID : AI-XXXX": `ID : ${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      "AI-XXXX": `${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`,
      "DD-MM-YYYY": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
    };
    replacePlainTextPlaceholders(doc.getZip(), plainTextReplacements);

    // Additional aggressive replacement for certificate ID in the entire XML
    // This handles cases where text might be split across nodes or formatted differently
    try {
      const docXml = doc.getZip().files["word/document.xml"];
      if (docXml) {
        let xmlContent = docXml.asText();
        const originalContent = xmlContent;

        // Replace AI-XXXX patterns in the entire XML (case-insensitive)
        // Handle various formats: "AI-XXXX", "[AI-XXXX]", "ID : AI-XXXX", "[ID : AI-XXXX]"
        const replacementValue = `${BOLD_MARKER_PREFIX}${printedId}${BOLD_MARKER_SUFFIX}`;

        // First, replace "ID : AI-XXXX" patterns (with or without brackets, with flexible spacing)
        xmlContent = xmlContent.replace(/\[?ID\s*:\s*AI-XXXX\]?/gi, (match) => {
          if (match.includes("[") && match.includes("]")) {
            return `[ID : ${replacementValue}]`;
          }
          return `ID : ${replacementValue}`;
        });

        // Then, replace standalone "AI-XXXX" patterns (only if not already part of "ID : AI-XXXX")
        // Check if the replacement already happened by looking for our replacement value
        if (!xmlContent.includes(replacementValue)) {
          xmlContent = xmlContent.replace(/\[?AI-XXXX\]?/gi, (match) => {
            if (match.includes("[") && match.includes("]")) {
              return `[${replacementValue}]`;
            }
            return replacementValue;
          });
        }

        // Update the XML if it was modified
        if (xmlContent !== originalContent) {
          doc.getZip().file("word/document.xml", xmlContent);
          console.log(`Certificate ID replaced in XML: ${data.certificateId}`);
        }
      }
    } catch (error: any) {
      console.error("Error in aggressive certificate ID replacement:", error);
      // Don't throw - continue without this replacement if it fails
    }

    // Post-process: Apply bold formatting to text between markers and remove markers
    applyBoldFormattingWithMarkers(
      doc.getZip(),
      BOLD_MARKER_PREFIX,
      BOLD_MARKER_SUFFIX
    );

    // QR code is handled by ImageModule during doc.render()
    // NOTE: The template MUST contain [%qrImage] placeholder for QR code to appear
    if (data.verificationUrl && qrCodeBuffer) {
      console.log(
        `[Certificate] QR code ready. Verification URL: ${data.verificationUrl}`
      );
      console.log(
        `[Certificate] ⚠️  Template must contain [%qrImage] placeholder for QR code to appear!`
      );
    }

    // Get the generated document
    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the DOCX file
    fs.writeFileSync(outputPath, buf);

    return Buffer.from(buf);
  } catch (error: any) {
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map((e: any) => {
          return `${e.name}: ${e.message}`;
        })
        .join("\n");
      throw new Error(`Template error: ${errorMessages}`);
    }
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
}

/**
 * Format date to DD-MM-YYYY format
 */
function formatDateDDMMYYYY(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    // If date parsing fails, return the original string
    return dateString;
  }
}

/**
 * Find LibreOffice executable path
 * On Windows, LibreOffice uses soffice.exe instead of libreoffice
 * On Linux/Ubuntu, uses libreoffice command
 * Returns null if not found (will throw error in convertDocxToPdf)
 */
function findLibreOfficePath(): string | null {
  const os = require("os");
  const platform = os.platform();

  if (platform === "win32") {
    // Common Windows installation paths
    const possiblePaths: string[] = [
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ];

    // Add paths from environment variables if they exist
    if (process.env.PROGRAMFILES) {
      possiblePaths.push(
        path.join(
          process.env.PROGRAMFILES,
          "LibreOffice",
          "program",
          "soffice.exe"
        )
      );
    }
    if (process.env["ProgramFiles(x86)"]) {
      possiblePaths.push(
        path.join(
          process.env["ProgramFiles(x86)"],
          "LibreOffice",
          "program",
          "soffice.exe"
        )
      );
    }

    for (const possiblePath of possiblePaths) {
      if (possiblePath && fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    // Try to find it in PATH or use soffice directly
    // If soffice.exe is in PATH, it will work
    return "soffice.exe";
  } else {
    // Linux/Ubuntu/Mac: check common installation paths first
    const possiblePaths = [
      "/usr/bin/libreoffice",
      "/usr/local/bin/libreoffice",
      "/opt/libreoffice/program/soffice",
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    // Fall back to libreoffice command (should be in PATH on Ubuntu)
    // On Ubuntu, when installed via apt-get, it's typically at /usr/bin/libreoffice
    return "libreoffice";
  }
}

/**
 * Convert DOCX to PDF using LibreOffice (REQUIRED for high quality)
 * LibreOffice provides superior PDF quality compared to docx-pdf
 * Installation: https://www.libreoffice.org/download/
 */
export async function convertDocxToPdf(
  docxPath: string,
  pdfPath: string
): Promise<void> {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  // Find LibreOffice executable path
  const libreOfficePath = findLibreOfficePath();
  if (!libreOfficePath) {
    throw new Error(
      `LibreOffice is REQUIRED for high-quality PDF generation but was not found.\n` +
        `Please install LibreOffice:\n` +
        `  Windows: https://www.libreoffice.org/download/download/\n` +
        `  Linux/Ubuntu: sudo apt-get install libreoffice\n` +
        `  macOS: brew install --cask libreoffice\n` +
        `After installation, restart the server.`
    );
  }

  // Per-invocation LibreOffice user-installation dir. The default profile at
  // %APPDATA%\LibreOffice\4\user (or ~/.config/libreoffice/4/user) holds a
  // singleton lock that `--nolockcheck` does NOT suppress — so two parallel
  // soffice calls, or a stale soffice from a prior crash, will collide and
  // exit 1 with empty stdout/stderr. Giving each call its own ephemeral
  // profile is the only reliable fix.
  let tempProfileDir: string | null = null;
  try {
    const outputDir = path.dirname(pdfPath);
    const docxFileName = path.basename(docxPath, path.extname(docxPath));

    // On Windows, we need to handle paths and escaping carefully
    // Use absolute paths and proper escaping
    const os = require("os");
    const platform = os.platform();
    const crypto = require("crypto");

    // Ephemeral profile dir, file:// URL with forward slashes (works on
    // Windows too — LibreOffice insists on URI form here).
    tempProfileDir = path.join(
      os.tmpdir(),
      `lo-profile-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    );
    fs.mkdirSync(tempProfileDir, { recursive: true });
    const userInstallationUrl = `file:///${tempProfileDir.replace(/\\/g, "/")}`;

    console.log(
      `[Certificate] Converting DOCX to PDF using LibreOffice (high quality)`
    );
    console.log(`[Certificate] LibreOffice path: ${libreOfficePath}`);
    console.log(`[Certificate] Input DOCX: ${docxPath}`);
    console.log(`[Certificate] Output directory: ${outputDir}`);
    console.log(`[Certificate] Expected PDF: ${pdfPath}`);
    console.log(`[Certificate] User profile: ${userInstallationUrl}`);

    // Use spawn instead of exec for better error handling, especially on Windows
    const { spawn } = require("child_process");

    // Build command arguments for spawn.
    // -env:UserInstallation MUST come before --headless/--invisible so
    // LibreOffice parses it as a bootstrap arg (it's a UNO env, not a flag).
    const commandArgs = [
      `-env:UserInstallation=${userInstallationUrl}`,
      platform === "win32" ? "--invisible" : "--headless",
      "--nodefault",
      "--nolockcheck",
      "--norestore",
      "--nologo",
      "--nofirststartwizard",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      docxPath,
    ];

    console.log(`[Certificate] LibreOffice command args:`, commandArgs);
    console.log(`[Certificate] Platform: ${platform}`);

    // Use spawn for better control and error handling
    // On Windows with paths containing spaces, we need to handle it carefully
    let libreOfficeProcess: any;

    if (platform === "win32") {
      // On Windows, quote the executable path to handle spaces
      // Build a command string that properly quotes the executable
      const quotedPath = `"${libreOfficePath}"`;
      const fullCommand = [quotedPath, ...commandArgs].join(" ");

      console.log(`[Certificate] Windows command string: ${fullCommand}`);

      // Use shell: true with a properly quoted command string
      libreOfficeProcess = spawn(fullCommand, [], {
        cwd: outputDir,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      });
    } else {
      // Linux/Mac: Use spawn normally
      libreOfficeProcess = spawn(libreOfficePath, commandArgs, {
        cwd: outputDir,
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
      });
    }

    let stdout = "";
    let stderr = "";

    libreOfficeProcess.stdout.on("data", (data: Buffer) => {
      const output = data.toString();
      stdout += output;
      if (output.trim()) {
        console.log(`[Certificate] LibreOffice stdout: ${output.trim()}`);
      }
    });

    libreOfficeProcess.stderr.on("data", (data: Buffer) => {
      const output = data.toString();
      stderr += output;
      if (output.trim()) {
        console.log(`[Certificate] LibreOffice stderr: ${output.trim()}`);
      }
    });

    // Wait for process to complete
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          libreOfficeProcess.kill();
          reject(
            new Error("LibreOffice conversion timed out after 30 seconds")
          );
        }, 30000);

        libreOfficeProcess.on("close", (code: number) => {
          clearTimeout(timeout);

          console.log(
            `[Certificate] LibreOffice process closed. Code: ${code}`
          );

          if (stdout.trim()) {
            console.log(`[Certificate] LibreOffice stdout: ${stdout.trim()}`);
          } else {
            console.log(`[Certificate] LibreOffice stdout: (empty)`);
          }

          if (stderr.trim()) {
            console.log(`[Certificate] LibreOffice stderr: ${stderr.trim()}`);
          } else {
            console.log(`[Certificate] LibreOffice stderr: (empty)`);
          }

          if (code === 0 || code === null) {
            console.log(
              `[Certificate] LibreOffice exited successfully (code: ${code})`
            );
            resolve();
          } else {
            reject(
              new Error(
                `LibreOffice exited with code ${code}.\n` +
                  `stdout: ${stdout || "(empty)"}\n` +
                  `stderr: ${stderr || "(empty)"}`
              )
            );
          }
        });

        libreOfficeProcess.on("error", (error: Error) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to start LibreOffice: ${error.message}`));
        });
      });
    } catch (execError: any) {
      console.error(
        `[Certificate] LibreOffice execution failed:`,
        execError.message
      );
      if (stdout) console.error(`[Certificate] Captured stdout: ${stdout}`);
      if (stderr) console.error(`[Certificate] Captured stderr: ${stderr}`);
      throw execError;
    }

    // Wait a bit for file system to sync (Windows sometimes needs this)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // LibreOffice creates PDF with same name but .pdf extension in the output directory
    // Check multiple possible locations
    const possiblePdfPaths = [
      pdfPath, // Expected final path
      path.join(outputDir, `${docxFileName}.pdf`), // Same name as DOCX
      path.join(outputDir, path.basename(docxPath).replace(/\.docx$/i, ".pdf")), // DOCX name with .pdf
      docxPath.replace(/\.docx$/i, ".pdf"), // Same directory as DOCX
    ];

    console.log(`[Certificate] Checking for PDF in possible locations:`);
    possiblePdfPaths.forEach((p) =>
      console.log(`  - ${p} (exists: ${fs.existsSync(p)})`)
    );

    // List all files in output directory for debugging
    try {
      const filesInDir = fs.readdirSync(outputDir);
      console.log(
        `[Certificate] Files in output directory: ${filesInDir.join(", ")}`
      );
    } catch (dirError) {
      console.log(`[Certificate] Could not list output directory: ${dirError}`);
    }

    // Find the actual PDF file
    let actualPdfPath: string | null = null;
    for (const possiblePath of possiblePdfPaths) {
      if (fs.existsSync(possiblePath)) {
        actualPdfPath = possiblePath;
        break;
      }
    }

    // If not found in expected locations, search for any PDF in the directory
    if (!actualPdfPath) {
      try {
        const filesInDir = fs.readdirSync(outputDir);
        const pdfFiles = filesInDir.filter((f: string) =>
          f.toLowerCase().endsWith(".pdf")
        );
        if (pdfFiles.length > 0) {
          actualPdfPath = path.join(outputDir, pdfFiles[0]);
          console.log(`[Certificate] Found PDF file: ${actualPdfPath}`);
        }
      } catch (dirError) {
        // Ignore directory read errors
      }
    }

    if (!actualPdfPath) {
      // List all files for debugging
      let allFiles = "";
      try {
        const filesInDir = fs.readdirSync(outputDir);
        allFiles = filesInDir.join(", ");
      } catch (e) {
        allFiles = "Could not read directory";
      }

      throw new Error(
        `PDF file was not created. Expected at: ${pdfPath}\n` +
          `Files in output directory: ${allFiles}\n` +
          `LibreOffice path: ${libreOfficePath}\n` +
          `LibreOffice args: ${commandArgs.join(" ")}\n` +
          `Check LibreOffice installation and permissions.`
      );
    }

    // Move/rename to expected location if needed
    if (actualPdfPath !== pdfPath) {
      console.log(
        `[Certificate] Moving PDF from ${actualPdfPath} to ${pdfPath}`
      );
      fs.renameSync(actualPdfPath, pdfPath);
    }

    // Verify PDF file is not empty
    const stats = fs.statSync(pdfPath);
    if (stats.size === 0) {
      throw new Error(
        `PDF file was created but is empty (0 bytes). LibreOffice conversion may have failed.`
      );
    }

    console.log(
      `[Certificate] PDF generated successfully: ${pdfPath} (${(
        stats.size / 1024
      ).toFixed(2)} KB)`
    );
    return; // Success
  } catch (error: any) {
    // Provide detailed error message
    if (error.code === "ENOENT" || error.message.includes("not found")) {
      throw new Error(
        `LibreOffice executable not found at: ${libreOfficePath}\n` +
          `Please ensure LibreOffice is installed and the path is correct.\n` +
          `Installation: https://www.libreoffice.org/download/`
      );
    } else if (error.code === "ETIMEDOUT") {
      throw new Error(
        `LibreOffice conversion timed out. The document may be too complex or LibreOffice may be unresponsive.\n` +
          `Original error: ${error.message}`
      );
    } else {
      throw new Error(
        `LibreOffice PDF conversion failed: ${error.message}\n` +
          `Please ensure LibreOffice is properly installed: https://www.libreoffice.org/download/`
      );
    }
  } finally {
    if (tempProfileDir) {
      try {
        fs.rmSync(tempProfileDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn(
          `[Certificate] Could not remove temp LibreOffice profile ${tempProfileDir}:`,
          cleanupError,
        );
      }
    }
  }
}

/**
 * Alternative: Convert DOCX to PDF using docx-pdf package
 * (Simpler but may have quality issues)
 */
export async function convertDocxToPdfAlternative(
  docxPath: string,
  pdfPath: string
): Promise<void> {
  try {
    // This requires docx-pdf package
    const convert = require("docx-pdf");

    return new Promise((resolve, reject) => {
      convert(docxPath, pdfPath, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to convert DOCX to PDF: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  } catch (error: any) {
    throw new Error(
      `docx-pdf not available. Install it with: npm install docx-pdf. Error: ${error.message}`
    );
  }
}
