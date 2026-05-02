# Exam/Task question selection — picker redesign

## Problem

The Exam and Task admin modals currently select questions through an infinite-scroll
multi-select dropdown. This is awkward for two real workflows:

1. **Bulk random selection by category** — e.g. "give me 20 random SAS questions for
   this entrance exam." Today the admin must scroll, search, and tick every one.
2. **Mixed workflow** — pick a few specific questions manually, then auto-fill the
   rest from a category. Today there is no notion of "auto" at all.

## Solution overview

Replace the dropdown with an **"Add questions" button** that opens a dedicated picker
modal. The picker has two tabs — **Auto** and **Manual** — and both write into a
shared, accumulating selection set. The user can switch tabs freely; each operation
adds to the running selection (de-duplicated). Cancel discards all picker-side
changes; Apply commits them back to the parent modal.

The selected questions are shown as a list under the "Add questions" button on the
parent modal, each row with a remove button.

## Components

### `QuestionPickerModal` (new, shared)

Path: `frontend/src/components/admin/QuestionPickerModal.tsx`.

Props:

- `isOpen`, `onClose`
- `usageFor`: `"exam" | "task"` — passed to the question list/random endpoints
- `selectedIds: string[]` — current selection from the parent modal
- `onApply(ids: string[]): void` — fired when the user clicks Apply

Internal state: `pendingIds: string[]` (initialized to `selectedIds` on open),
`activeTab: "auto" | "manual"`, plus tab-local state.

#### Auto tab

Inputs:

- Category — single-select dropdown over `QUESTION_CATEGORY_OPTIONS`
- Count — number input

"Add" button calls the new random endpoint with `category`, `limit=count`,
`usageFor`, and `exclude=pendingIds`. Server returns up to `count` random questions
matching, all `isActive: true`. Returned IDs are appended to `pendingIds`. If fewer
were available than requested, a toast notifies (e.g. "Added 19 questions from
SAS — only 19 were available").

#### Manual tab

Layout:

- Category filter (single, includes "All categories")
- Search box (debounced, ~300ms)
- Paginated list — each row: checkbox, question text (truncated), category badge,
  score. Clicking the row toggles its presence in `pendingIds`.

The list is fetched from the existing `/internship-questions/admin` list endpoint
with `usageFor`, `category`, `search`, `page`, `limit=15`. Reuses the same paging
controls as the existing question bank page.

#### Footer (shared by both tabs)

- Counter: "Selected: N · Total score: X" (X computed from a small in-memory map of
  fetched questions; for IDs the user accumulates without seeing the row, X is just
  the sum we know about — close enough for UX, real total is computed server-side
  on save)
- Cancel — discards `pendingIds`
- Apply — calls `onApply(pendingIds)` and closes the modal

### Backend — new random-pick endpoint

`GET /api/internship-questions/admin/random`

Query params:

- `category` — one of the fixed category values (required)
- `usageFor` — `"exam"` or `"task"` (required)
- `limit` — positive integer, capped server-side at e.g. 200
- `exclude` — comma-separated list of question IDs to exclude

Server behavior:

```
$match: {
  category,
  usageType: { $in: [usageFor, "both"] },
  isActive: true,
  _id: { $nin: exclude },
}
$sample: { size: limit }
$project: { questionText, type, usageType, score, isActive, category }
```

Response shape: `{ questions: QuestionRow[], requested: number, returned: number }`.

### Parent modals — `ExamUpsertModal` and `TaskUpsertModal`

Both lose the `InfiniteScrollSelect` for questions and gain:

1. **"Add questions" button** that opens `QuestionPickerModal`
2. **Selected questions list** below the button — each row shows question text,
   score, category badge, and a × remove button
3. The same `questionIds: string[]` state remains; only the UI changes

To render the selected list, both modals fetch full question details for the IDs
in `questionIds` (one batched fetch) so they can show titles, scores, and
categories. Already-loaded data from the picker is reused via a small cache keyed
by ID kept on the parent modal.

## Out of scope

- No reorderable list (questions stay in insertion order).
- No "remove all" / "clear" button — admin can use the × on each row.
- No export of the auto-pick to a saved preset.
- The picker reuses the question bank's question categories — no new taxonomy.
