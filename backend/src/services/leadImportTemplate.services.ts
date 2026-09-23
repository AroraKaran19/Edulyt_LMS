import ExcelJS from "exceljs";
import { CollegeModel } from "../models/college.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipModel } from "../models/internship.schema";
import { BRANDS } from "../constants/brands";
import { INDIAN_STATES } from "../constants/indianStates";
import { getLeadPipeline, type LeadPipeline } from "./leadPipelineSettings.services";

export const LEAD_IMPORT_COLUMNS = [
  "name",
  "email",
  "phone",
  "brand",
  "collegeName",
  "state",
  "programKind",
  "programSlug",
  "status",
  "subStatus",
  "extras",
] as const;

const TEMPLATE_DATA_ROWS = 2000;
const EXAMPLE_ROW_COUNT = 2;

export interface LeadImportTemplateData {
  collegeNames: string[];
  programSlugs: string[];
  pipeline: LeadPipeline;
}

/** Everything the template's dropdowns are built from, fetched in parallel with lean, projected queries. */
export const fetchLeadImportTemplateData = async (): Promise<LeadImportTemplateData> => {
  const [colleges, courses, internships, pipeline] = await Promise.all([
    CollegeModel.find({ isActive: true }, { name: 1, _id: 0 }).lean(),
    CourseModel.find({ isActive: true }, { slug: 1, _id: 0 }).lean(),
    InternshipModel.find({ isActive: true }, { slug: 1, _id: 0 }).lean(),
    getLeadPipeline(),
  ]);

  const collegeNames = [
    ...new Set(
      (colleges as { name?: string }[])
        .map((c) => String(c.name ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const programSlugs = [
    ...new Set(
      [...(courses as { slug?: string }[]), ...(internships as { slug?: string }[])]
        .map((doc) => String(doc.slug ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return { collegeNames, programSlugs, pipeline };
};

/** A valid, unique Excel defined-name for a pipeline stage's sub-status list. */
const sanitiseRangeName = (label: string, index: number, taken: Set<string>): string => {
  let base = `SubStatus_${label.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
  if (!/^[A-Za-z_]/.test(base)) base = `_${base}`;
  base = base.slice(0, 200) || `SubStatus_${index}`;
  let name = base;
  let n = 2;
  while (taken.has(name.toLowerCase())) {
    name = `${base}_${n}`;
    n += 1;
  }
  taken.add(name.toLowerCase());
  return name;
};

const GRAY_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" },
};

/** Builds the importer's .xlsx template from already-fetched list data. Pure: no I/O. */
export const buildLeadImportTemplateWorkbook = (
  data: LeadImportTemplateData,
): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Edulyt LMS";
  workbook.created = new Date();

  const activeStages = data.pipeline.stages.filter((s) => s.active);
  const statusLabels = activeStages.map((s) => s.label);

  // --- Lists sheet (hidden): every dropdown's source range, plus the stage -> sub-status range name map. ---
  const lists = workbook.addWorksheet("Lists", { state: "veryHidden" });

  const writeColumn = (col: number, header: string, values: string[]): number => {
    lists.getCell(1, col).value = header;
    values.forEach((v, i) => {
      lists.getCell(i + 2, col).value = v;
    });
    return values.length;
  };

  const brandCount = writeColumn(1, "Brand", [...BRANDS]);
  const programKindCount = writeColumn(2, "ProgramKind", ["course", "internship"]);
  const stateCount = writeColumn(3, "State", [...INDIAN_STATES]);
  const collegeCount = writeColumn(4, "College", data.collegeNames);
  const programSlugCount = writeColumn(5, "ProgramSlug", data.programSlugs);
  const statusCount = writeColumn(6, "Status", statusLabels);

  workbook.definedNames.add(`Lists!$A$2:$A$${Math.max(brandCount, 1) + 1}`, "Brands");
  workbook.definedNames.add(`Lists!$B$2:$B$${Math.max(programKindCount, 1) + 1}`, "ProgramKinds");
  workbook.definedNames.add(`Lists!$C$2:$C$${Math.max(stateCount, 1) + 1}`, "States");
  if (collegeCount > 0) {
    workbook.definedNames.add(`Lists!$D$2:$D$${collegeCount + 1}`, "Colleges");
  }
  if (programSlugCount > 0) {
    workbook.definedNames.add(`Lists!$E$2:$E$${programSlugCount + 1}`, "ProgramSlugs");
  }
  workbook.definedNames.add(`Lists!$F$2:$F$${Math.max(statusCount, 1) + 1}`, "StatusLabels");

  // One column per active stage, holding its active sub-status labels; named for INDIRECT lookup.
  const takenRangeNames = new Set<string>();
  const stageRangeNameByLabel = new Map<string, string>();
  let nextCol = 7;
  for (let i = 0; i < activeStages.length; i += 1) {
    const stage = activeStages[i];
    const subLabels = stage.subStatuses.filter((s) => s.active).map((s) => s.label);
    if (subLabels.length === 0) continue;
    const rangeName = sanitiseRangeName(stage.label, i, takenRangeNames);
    const count = writeColumn(nextCol, stage.label, subLabels);
    workbook.definedNames.add(
      `Lists!$${lists.getColumn(nextCol).letter}$2:$${lists.getColumn(nextCol).letter}$${count + 1}`,
      rangeName,
    );
    stageRangeNameByLabel.set(stage.label, rangeName);
    nextCol += 1;
  }

  // Stage label -> its sub-status range name, looked up by the subStatus column's INDIRECT formula.
  const mapCol = nextCol;
  lists.getCell(1, mapCol).value = "StageLabel";
  lists.getCell(1, mapCol + 1).value = "StageRangeName";
  let mapRow = 2;
  for (const [label, rangeName] of stageRangeNameByLabel) {
    lists.getCell(mapRow, mapCol).value = label;
    lists.getCell(mapRow, mapCol + 1).value = rangeName;
    mapRow += 1;
  }
  const mapLastRow = Math.max(mapRow - 1, 2);
  const mapColLetter = lists.getColumn(mapCol).letter;
  const mapColLetter2 = lists.getColumn(mapCol + 1).letter;

  // --- Leads sheet ---
  const sheet = workbook.addWorksheet("Leads", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headerRow = sheet.addRow([...LEAD_IMPORT_COLUMNS]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
  });

  sheet.columns = [
    { key: "name", width: 22 },
    { key: "email", width: 28 },
    { key: "phone", width: 16 },
    { key: "brand", width: 12 },
    { key: "collegeName", width: 30 },
    { key: "state", width: 20 },
    { key: "programKind", width: 14 },
    { key: "programSlug", width: 26 },
    { key: "status", width: 18 },
    { key: "subStatus", width: 24 },
    { key: "extras", width: 34 },
  ];
  const phoneColLetter = "C";
  sheet.getColumn(3).numFmt = "@";

  const exampleRows: (string | number)[][] = [
    [
      "Jane Doe",
      "jane.doe@example.com",
      "9876543210",
      BRANDS[0],
      data.collegeNames[0] ?? "Example Institute of Technology",
      "Delhi",
      "course",
      data.programSlugs[0] ?? "sample-course-slug",
      statusLabels[0] ?? "",
      "",
      '{"Year":"3rd"}',
    ],
    [
      "John Doe",
      "john.doe@example.com",
      "9123456780",
      BRANDS[1] ?? BRANDS[0],
      "",
      "",
      "internship",
      data.programSlugs[1] ?? data.programSlugs[0] ?? "sample-internship-slug",
      "",
      "",
      "",
    ],
  ];
  for (const values of exampleRows) {
    const row = sheet.addRow(values);
    row.getCell(3).numFmt = "@";
    row.eachCell((cell) => {
      cell.fill = GRAY_FILL;
    });
  }

  // --- Data validation for rows 2..2001 ---
  const firstDataRow = 2;
  const lastDataRow = firstDataRow + TEMPLATE_DATA_ROWS - 1;
  for (let r = firstDataRow; r <= lastDataRow; r += 1) {
    sheet.getCell(`D${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ["Brands"],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Choose airkrit or edulyt",
    };
    sheet.getCell(`F${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["States"],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Choose a state from the list",
    };
    sheet.getCell(`E${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["Colleges"],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "College not in the list",
      error: "This college isn't in the directory yet. You can still type it in; it just won't be pre-validated.",
    };
    sheet.getCell(`G${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["ProgramKinds"],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Choose course or internship",
    };
    sheet.getCell(`H${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["ProgramSlugs"],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Slug not in the list",
      error: "This slug isn't in the active list. Double check it before importing.",
    };
    sheet.getCell(`I${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["StatusLabels"],
      showErrorMessage: true,
      errorStyle: "error",
      error: "Choose a pipeline stage label",
    };
    sheet.getCell(`J${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [
        `INDIRECT(VLOOKUP($I${r},Lists!$${mapColLetter}$2:$${mapColLetter2}$${mapLastRow},2,FALSE))`,
      ],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Sub-status not in the list",
      error: "Pick a status first, or check the sub-status belongs to it.",
    };
  }

  // --- Instructions sheet ---
  const instructions = workbook.addWorksheet("Instructions");
  instructions.columns = [
    { header: "Column", key: "column", width: 16 },
    { header: "Required", key: "required", width: 12 },
    { header: "Allowed values", key: "allowed", width: 70 },
  ];
  instructions.getRow(1).font = { bold: true };
  instructions.getRow(1).fill = HEADER_FILL;
  instructions.addRows([
    { column: "name", required: "Yes", allowed: "Any text" },
    { column: "email", required: "Yes", allowed: "A valid email address" },
    {
      column: "phone",
      required: "Yes",
      allowed: `A valid mobile number (column ${phoneColLetter} is text-formatted so leading digits are kept)`,
    },
    { column: "brand", required: "Yes", allowed: `One of: ${BRANDS.join(", ")}` },
    {
      column: "collegeName",
      required: "No",
      allowed: "Pick from the dropdown, or type a college not yet in the directory (this only warns, it does not block import)",
    },
    { column: "state", required: "No", allowed: `One of: ${INDIAN_STATES.join(", ")}` },
    { column: "programKind", required: "No", allowed: "course or internship (must be given together with programSlug)" },
    {
      column: "programSlug",
      required: "No",
      allowed: "The slug of an active course or internship (must be given together with programKind)",
    },
    { column: "status", required: "No", allowed: "A pipeline stage label; leave blank for the default stage" },
    {
      column: "subStatus",
      required: "No",
      allowed: "A sub-status label belonging to the chosen status; leave blank for that stage's default",
    },
    {
      column: "extras",
      required: "No",
      allowed: 'A JSON object of simple values, for example {"Year":"3rd"}, shown in the lead\'s details',
    },
  ]);
  instructions.addRow([]);
  instructions.addRow([
    "Delete the two shaded example rows on the Leads sheet before importing.",
  ]);

  // Lists is sheet 0; without this Excel opens on it even though it is hidden.
  workbook.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 1, activeTab: 1, visibility: "visible" }];
  return workbook;
};

export const generateLeadImportTemplateBuffer = async (): Promise<Buffer> => {
  const data = await fetchLeadImportTemplateData();
  const workbook = buildLeadImportTemplateWorkbook(data);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};
