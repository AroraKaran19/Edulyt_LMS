import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";
import { DOMParser, XMLSerializer } from "xmldom";

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
}

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
          const preserveSpace = textNode.getAttribute("xml:space") === "preserve";
          runsToProcess.push({ 
            runNode, 
            textNode, 
            textContent, 
            preserveSpace,
            originalRPr 
          });
        }
      }
    });

    // Process each run that contains markers
    runsToProcess.forEach(({ runNode, textNode, textContent, preserveSpace, originalRPr }) => {
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
          const beforeText = remainingText.substring(currentIndex, startIndex);
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
    });

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

    // Configure docxtemplater with custom delimiters to use [] instead of {{}}
    // Enable modules for rich text support
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "[",
        end: "]",
      },
      paragraphLoop: true,
      linebreaks: true,
      modules: [], // We'll use XML formatting directly
    });

    // Prepare data for replacement
    // Use unique markers for text that should be bold, so we can identify and format them later
    const BOLD_MARKER_PREFIX = "___BOLD_START___";
    const BOLD_MARKER_SUFFIX = "___BOLD_END___";

    const formattedDate = formatDateDDMMYYYY(data.completionDate);

    const templateData: any = {
      "Your Name": data.studentName, // Not bold (used in greeting)
      "Full Name": `${BOLD_MARKER_PREFIX}${data.studentName}${BOLD_MARKER_SUFFIX}`, // Will be made bold
      "Course Name": `${BOLD_MARKER_PREFIX}${data.courseName}${BOLD_MARKER_SUFFIX}`, // Will be made bold
      "Key Topics or Technologies": `${BOLD_MARKER_PREFIX}${
        data.keyTopics || "the course topics"
      }${BOLD_MARKER_SUFFIX}`, // Will be made bold
      // Date format: DD-MM-YYYY (will be made bold)
      // Support multiple variations
      "DD-MM-YYYY": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      "Date": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      "Completion Date": `${BOLD_MARKER_PREFIX}${formattedDate}${BOLD_MARKER_SUFFIX}`,
      // Certificate ID (will be made bold)
      // Support multiple variations including "ID : AI-XXXX" format
      "AI-XXXX": `${BOLD_MARKER_PREFIX}${data.certificateId}${BOLD_MARKER_SUFFIX}`,
      "ID : AI-XXXX": `ID : ${BOLD_MARKER_PREFIX}${data.certificateId}${BOLD_MARKER_SUFFIX}`,
      "Certificate ID": `${BOLD_MARKER_PREFIX}${data.certificateId}${BOLD_MARKER_SUFFIX}`,
      "ID": `${BOLD_MARKER_PREFIX}${data.certificateId}${BOLD_MARKER_SUFFIX}`,
    };

    // Render the document (replace placeholders with marked text)
    try {
    doc.render(templateData);
    } catch (renderError: any) {
      // Log template data keys for debugging
      console.log("Available template data keys:", Object.keys(templateData));
      if (renderError.properties && renderError.properties.errors) {
        console.error("Template rendering errors:", renderError.properties.errors);
      }
      throw renderError;
    }

    // Post-process: Apply bold formatting to text between markers and remove markers
    applyBoldFormattingWithMarkers(
      doc.getZip(),
      BOLD_MARKER_PREFIX,
      BOLD_MARKER_SUFFIX
    );

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
        path.join(process.env.PROGRAMFILES, "LibreOffice", "program", "soffice.exe")
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
 * Convert DOCX to PDF
 * Tries LibreOffice first (better quality), falls back to docx-pdf if LibreOffice is not available
 */
export async function convertDocxToPdf(
  docxPath: string,
  pdfPath: string
): Promise<void> {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const execAsync = promisify(exec);

  // Try LibreOffice first (better quality)
  try {
    // Find LibreOffice executable path
    const libreOfficePath = findLibreOfficePath();
    if (!libreOfficePath) {
      throw new Error("LibreOffice not found");
    }

    // Use LibreOffice to convert DOCX to PDF
    // LibreOffice must be installed: https://www.libreoffice.org/download/
    const command = `"${libreOfficePath}" --headless --convert-to pdf --outdir "${path.dirname(
      pdfPath
    )}" "${docxPath}"`;

    await execAsync(command);

    // LibreOffice creates PDF with same name but .pdf extension
    const expectedPdfPath = docxPath.replace(/\.docx$/i, ".pdf");
    const finalPdfPath = path.join(
      path.dirname(pdfPath),
      path.basename(expectedPdfPath)
    );

    // Rename if needed
    if (fs.existsSync(finalPdfPath) && finalPdfPath !== pdfPath) {
      fs.renameSync(finalPdfPath, pdfPath);
    }

    // Verify PDF was created
    if (fs.existsSync(pdfPath)) {
      return; // Success with LibreOffice
    }
  } catch (error: any) {
    // LibreOffice failed, try fallback
    console.warn(
      `LibreOffice conversion failed: ${error.message}. Trying docx-pdf fallback...`
    );
  }

  // Fallback to docx-pdf if LibreOffice is not available
  try {
    const convert = require("docx-pdf");

    return new Promise((resolve, reject) => {
      convert(docxPath, pdfPath, (err: Error | null) => {
        if (err) {
          reject(
            new Error(
              `Failed to convert DOCX to PDF using docx-pdf: ${err.message}. Please install LibreOffice for better results: https://www.libreoffice.org/download/`
            )
          );
        } else {
          // Verify PDF was created
          if (fs.existsSync(pdfPath)) {
            resolve();
          } else {
            reject(
              new Error(
                "PDF file was not created. Please install LibreOffice: https://www.libreoffice.org/download/"
              )
            );
          }
        }
      });
    });
  } catch (error: any) {
    throw new Error(
      `Failed to convert DOCX to PDF. Neither LibreOffice nor docx-pdf is available. Error: ${error.message}. Please install LibreOffice: https://www.libreoffice.org/download/`
    );
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
