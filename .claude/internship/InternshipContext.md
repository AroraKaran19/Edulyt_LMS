# Internship Module — Context & Design Specification

## Overview

The Internship module is a full-featured system within the LMS that covers the entire lifecycle of an internship program: enrollment (via exam or direct payment), a shared question bank, dynamically scheduled tasks, and exam-based assessments.

---

## 1. Enrollment

There are **two distinct paths** a user can take to get enrolled in an internship:

### Path 1 — Exam-Based Enrollment (Merit Pool)

1. User attempts the internship entrance exam.
2. If the user's score meets or exceeds the **threshold score**, they are added to the **merit candidate pool**.
3. Being in the merit pool does **not** guarantee enrollment. The admin manually selects candidates from the pool based on available seats.
   - Example: 1,000 students sit the exam → 500 cross the threshold → internship has 100 seats → admin picks 100 from those 500.
4. Admin approval is **mandatory** for this path.

**Status flow:** `attempted` → `in_merit_pool` → `admin_approved` / `admin_rejected` → `enrolled`

### Path 2 — Paid / Confirmed Seat Enrollment

1. User either:
   - Fails to reach the threshold score on the exam, **OR**
   - Is uncertain about their exam result and wants a guaranteed seat proactively.
2. User pays the **batch price** (a fixed amount decided per internship/batch).
3. Payment confirmation = **immediate, guaranteed enrollment** with no admin approval step.

**Status flow:** `payment_initiated` → `payment_confirmed` → `enrolled`

### Key Enrollment Fields

```
enrollmentDate: Date               // Date admin approves OR payment is confirmed
enrollmentType: "merit" | "paid"
status: "pending" | "in_merit_pool" | "admin_approved" | "admin_rejected" | "enrolled"
paymentAmount?: number             // Only for paid path
paymentConfirmedAt?: Date
internship: Internship["_id"]
user: User["_id"]
```

---

## 2. Question Bank

Questions are **created and stored independently** — they are not linked to any specific internship, exam, or task at creation time. They live in their own collection and are reused across exams and tasks.

### Question Types

#### 2a. MCQ (Multiple Choice Question)

- Contains **x number of options** (at least 2).
- Has **y number of correct options** (at least 1; can be multi-select).
- Each question carries a **fixed score** (points assigned at creation).
- Marks are awarded **automatically** upon submission based on correct option matching.

**Schema sketch:**
```
type: "mcq"
questionText: string
options: Array<{
  optionText: string
  isCorrect: boolean
}>
score: number                      // max marks for this question
```

#### 2b. File Upload Question

- Admin creates the question with an **optional reference file** (e.g., a template, dataset, or instructions PDF).
- Admin assigns a **maximum possible score** at creation.
- Marks are **not** awarded automatically — the submission goes through a **review stage**.

**Review Stage:**
- The submitted file is reviewed by an **Admin** or **Instructor**.
- The reviewer decides the actual points to award (within the max score).
- `reviewedBy` must be stored (Admin `_id` or Instructor `_id`).
- The user has the option to **re-upload** their submission before a final review decision.

**Schema sketch:**
```
type: "file_upload"
questionText: string
referenceFile?: string             // URL/path to optional reference file
maxScore: number                   // max marks the reviewer can assign
```

**Submission schema sketch:**
```
question: Question["_id"]
user: User["_id"]
submittedFile: string              // URL/path to uploaded file
status: "submitted" | "under_review" | "reviewed" | "re_upload_requested"
awardedScore?: number              // set by reviewer
reviewedBy?: Admin["_id"] | Instructor["_id"]
reviewedAt?: Date
reUploadHistory: Array<{
  file: string
  uploadedAt: Date
}>
```

---

## 3. Tasks

Tasks are **question sets assigned to an internship** with a dynamic schedule tied to each user's individual `enrollmentDate`. This means the same task unlocks and becomes due on different calendar dates for different users depending on when they enrolled.

### How Task Scheduling Works

- Admin creates a task and sets:
  - **`unlockAfterDays`** — number of days after a user's `enrollmentDate` when the task becomes visible.
  - **`dueDays`** — number of days after a user's `enrollmentDate` when the task is due (deadline).
- These are stored as integers (not fixed dates). Actual unlock/due dates are computed at runtime per user:
  ```
  userUnlockDate = enrollmentDate + unlockAfterDays
  userDueDate    = enrollmentDate + dueDays
  ```

**Example:**
- Admin sets `unlockAfterDays: 15`, `dueDays: 22`
- User A enrolled May 1 → visible May 16, due May 23
- User B enrolled May 6 → visible May 21, due May 28

### Task Schema sketch

```
type: "task"
title: string
description?: string
internship: Internship["_id"]
questions: Array<Question["_id"]>  // only questions from question bank
unlockAfterDays: number            // days from enrollmentDate to unlock
dueDays: number                    // days from enrollmentDate until due
totalScore: number                 // sum of all question scores
```

### Task–Question Rules

- Only questions tagged/typed as `"task"` from the question bank are eligible for selection.
- Both MCQ and File Upload questions can be used in tasks.
- File Upload questions in tasks follow the same review flow described above.

---

## 4. Exams

Exams follow the same structural model as tasks (question sets, internship-scoped, dynamic scheduling), but they are categorized separately as `type: "exam"`.

### Key Differences from Tasks

| Aspect | Task | Exam |
|---|---|---|
| Type tag | `"task"` | `"exam"` |
| Purpose | Ongoing assignments / project work | Formal assessment / gating mechanism |
| Used for enrollment threshold | No | Yes (entrance exam) |
| Scheduling | Dynamic (days from enrollmentDate) | Dynamic (days from enrollmentDate) |

### Exam Schema sketch

```
type: "exam"
title: string
description?: string
internship: Internship["_id"]
questions: Array<Question["_id"]>  // only questions tagged "exam"
unlockAfterDays: number
dueDays: number
thresholdScore?: number            // passing score for merit-pool eligibility (entrance exams)
totalScore: number
```

---

## 5. Scoring & Review Summary

| Question Type | Auto-scored? | Reviewer Involved? | Re-upload? |
|---|---|---|---|
| MCQ | Yes | No | No |
| File Upload | No | Yes (Admin / Instructor) | Yes |

- **MCQ** submissions are evaluated immediately on submission.
- **File Upload** submissions enter a review queue. Points are awarded only after a reviewer approves and sets the `awardedScore`.
- `reviewedBy` stores the `_id` of the Admin or Instructor who performed the review.
- The user may re-upload a file (tracked in `reUploadHistory`) before a final decision is made.

---

## 6. Relationships Diagram (Conceptual)

```
Internship
  ├── has many Exams (type: "exam")
  │     └── each Exam references Questions (type: "exam") from Question Bank
  ├── has many Tasks (type: "task")
  │     └── each Task references Questions (type: "task") from Question Bank
  └── has many Enrollments
        ├── Path A: Exam → Merit Pool → Admin Approval → Enrolled
        └── Path B: Payment → Enrolled

Question Bank (independent collection)
  ├── MCQ questions
  └── File Upload questions
        └── Submissions → Review Queue → Awarded Score (by Admin/Instructor)
```

---

## 7. Open Design Decisions / Notes

- **Batch price** is set per internship (or per batch within an internship). Needs a `batchPrice` field on the Internship or Batch model.
- **Threshold score** for merit-pool eligibility is set on the entrance exam, not on the internship itself.
- **Admin seat selection** from the merit pool needs a dedicated UI flow (filter by score, approve/reject individuals).
- **Task/Exam question tagging** — questions should have a `usageType: "task" | "exam" | "both"` or be filterable by type when the admin selects questions while building a task/exam.
- **File review assignment** — it is TBD whether file upload submissions are assigned to a specific reviewer or pulled from a shared review queue.
