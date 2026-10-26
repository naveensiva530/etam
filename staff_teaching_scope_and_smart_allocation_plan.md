# 🚀 Staff Teaching Scope & Smart Allocation Engine
## Production-Grade Architecture & Implementation Plan

---

## 1. Executive Summary & Problem Analysis

In real-world educational institutions, the relationship between **Staff** and what they **Teach** is dynamic and context-dependent:

| Institution Type | Primary Unit | Teaching Reality & Edge Cases |
|---|---|---|
| **🏫 School** | Grade Wings (Primary, Middle, High, Hr.Sec) | • **Class 1 & 2:** Often 1 Class Teacher / Generalist handles all core subjects (English, Maths, EVS).<br>• **Class 3 to 5:** A single teacher may handle Mathematics across Grades 3, 4, and 5.<br>• **Substitutions:** A Maths teacher may occasionally cover Science or Physical Education. |
| **🎓 College** | Academic Departments (CSE, EEE, Mech, etc.) | • Faculty belongs to a parent department (e.g., CSE).<br>• Faculty teaches across years (1st, 2nd, 3rd, Final Year).<br>• **Cross-Departmental Service Teaching:** E.g., Mechanical faculty teaches *Engineering Graphics* for CSE; Science & Humanities faculty teaches *Maths* for all branches. |
| **💻 Training Institute** | Cohorts / Course Tracks (Web Dev, AI, Cloud) | • Trainers have primary domains (e.g., Full Stack).<br>• Trainers teach multiple modular topics (React, Node, TypeScript, Docker).<br>• Guest lecturers & mentors rotate between batches and bootcamps. |

### The Core Flaw in Traditional Systems:
* **Flaw A (Overly Rigid / Hard Lock):** Forcing a staff member to *only* teach their onboarded subject breaks real-life workflows (substitutions, multi-disciplinary teaching).
* **Flaw B (Overly Flat / Unstructured):** Showing an unranked list of 50-100 staff with no context forces administrators to click, scroll, and guess repeatedly.

### The Solution: "Flexible Capability Tagging + 3-Tier Smart Recommendation"
1. **Onboarding is lightweight & flexible:** Captures **Primary Domain** + **Multi-Skill Tags** + **Eligible Wings/Years** without locking anyone.
2. **Allocation is intelligent but unrestricted ("Suggest, Never Block"):** Top recommendations appear right at the top for 1-click selection, while a searchable list of all institution staff remains available.

---

## 2. Architecture & Data Model (Backward-Compatible)

### Database Changes (`staff` table)

We add structured, nullable JSON/text fields to MySQL `staff` table via a new migration (`006_add_staff_teaching_scope.sql`):

```sql
-- Migration 006_add_staff_teaching_scope.sql
ALTER TABLE staff
  ADD COLUMN teaching_wing VARCHAR(100) NULL AFTER department,       -- e.g. 'Primary', 'Middle', 'High School', 'Engineering', 'Bootcamp'
  ADD COLUMN eligible_grades JSON NULL AFTER teaching_wing,          -- e.g. ["Class 1", "Class 2", "Class 3"] or ["1st Year", "2nd Year"] or ["Batch 2026"]
  ADD COLUMN primary_subjects JSON NULL AFTER eligible_grades,       -- e.g. ["Mathematics", "Science"] or ["React.js", "Node.js"]
  ADD COLUMN is_class_teacher_eligible BOOLEAN NOT NULL DEFAULT FALSE AFTER primary_subjects;
```

#### Why JSON?
* **Zero schema churn:** Allows schools (grades), colleges (years/degrees), and training institutes (batches/tracks) to store their tags flexibly without separate tables.
* **Backward-compatible:** Existing staff records have `NULL` values and continue working without error.

---

## 3. UI/UX Design: Institution-Aware Staff Onboarding

When creating or editing staff in [`StaffFieldsGrid.tsx`](file:///c:/Users/DELL/Pictures/E-tam/apps/web/src/features/staff/components/StaffFieldsGrid.tsx), the form renders an interactive **"Teaching & Academic Scope"** card tailored to `institutionType`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🎓 Teaching Scope & Capabilities (Optional & Flexible)                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [🏫 School Mode]                                                      │
│  Teaching Wing:    [ Primary Wing (Class 1 - 5) ▼ ]                    │
│  Eligible Classes: [☑ Class 1] [☑ Class 2] [☑ Class 3] [☐ Class 4]    │
│  Skill Tags:       [ Mathematics ⨉ ] [ Tamil ⨉ ] [ + Add Subject ]     │
│  Class Teacher:    [☑ Eligible for Class Teacher Assignment]           │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  [🎓 College Mode]                                                     │
│  Department:       [ Computer Science & Engineering ▼ ]                │
│  Teaching Years:   [☑ 1st Year] [☑ 2nd Year] [☑ 3rd Year] [☐ 4th Year] │
│  Specializations:  [ Data Structures ⨉ ] [ AI/ML ⨉ ] [ + Add Skill ]   │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  [💻 Training Institute Mode]                                          │
│  Track / Domain:   [ Full Stack Web Development ▼ ]                    │
│  Active Batches:   [☑ MERN Cohort 12] [☑ Weekend FastTrack]            │
│  Modules / Topics: [ React ⨉ ] [ TypeScript ⨉ ] [ Docker ⨉ ]           │
└────────────────────────────────────────────────────────────────────────┘
```

> **Key Production Detail:** All fields are **strictly optional**. Staff can be onboarded immediately with basic info, and teaching scope can be populated or edited anytime.

---

## 4. The 3-Tier Recommendation Engine (In Timetable & Allocation)

When assigning a teacher in [`PeriodAssignModal.tsx`](file:///c:/Users/DELL/Pictures/E-tam/apps/web/src/features/timetable/components/PeriodAssignModal.tsx) or [`QuickFillPanel.tsx`](file:///c:/Users/DELL/Pictures/E-tam/apps/web/src/features/timetable/components/QuickFillPanel.tsx):

### Match Scoring Algorithm:
Each staff member is assigned a real-time affinity score ($S$):

$$\text{Score} = (w_1 \cdot M_{\text{subject}}) + (w_2 \cdot M_{\text{allocated}}) + (w_3 \cdot M_{\text{grade}}) + (w_4 \cdot M_{\text{dept}})$$

* **$M_{\text{allocated}}$ (+50 pts):** Staff is already pre-allocated to this subject in Academic Configuration.
* **$M_{\text{subject}}$ (+30 pts):** Staff has this subject in their `primary_subjects` skill tags.
* **$M_{\text{grade}}$ (+20 pts):** Staff's `eligible_grades` includes the current class / year.
* **$M_{\text{dept}}$ (+10 pts):** Staff belongs to the same department / wing.

### Display Grouping:
```
┌────────────────────────────────────────────────────────────┐
│ Select Faculty for "Mathematics" — Class 3-A               │
├────────────────────────────────────────────────────────────┤
│ ⭐ RECOMMENDED MATCHES (High Affinity)                     │
│   • Gayathri S. (Primary Maths Specialist • Class 1-5)     │
│   • Priya K. (Allocated in Subject Config)                 │
├────────────────────────────────────────────────────────────┤
│ 🏢 SAME WING / DEPARTMENT                                  │
│   • Revathi M. (Primary Wing)                              │
│   • Suresh V. (Primary Wing)                               │
├────────────────────────────────────────────────────────────┤
│ 🌐 ALL OTHER STAFF (Cross-teaching & Substitutes)          │
│   • Dr. Arun (High School Maths)                           │
│   • John Doe (Physical Education)                          │
│   🔍 [ Search any staff member... ]                        │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Roadmap (Phase by Phase)

### Phase 1: Database & Backend Foundation
* **Migration `006_add_staff_teaching_scope.sql`**: Add `teaching_wing`, `eligible_grades`, `primary_subjects`, `is_class_teacher_eligible`.
* **Update `staff.repository.js`**:
  * Parse JSON columns on read (`JSON.parse` or MySQL JSON mapping).
  * Serialize JSON arrays on insert/update.
* **Update `staff.validation.js`**: Add Joi/Zod rules for the optional scope fields.

### Phase 2: Staff Frontend & Onboarding UI
* **Update `staff.types.ts`**: Add `TeachingScope` interface to `StaffRecord` and `StaffInput`.
* **Create `TeachingScopeFields.tsx`**: A reusable, responsive card component that switches options based on `institutionType` (School / College / Training).
* **Integrate into `StaffFieldsGrid.tsx` & `ViewStaff.tsx`**: Add the card seamlessly below qualification and department fields.

### Phase 3: Recommendation Engine & Timetable Integration
* **Create `useStaffAffinity.ts` Hook**: Calculates tier sorting for any subject and class context.
* **Enhance `PeriodAssignModal.tsx`**:
  * Render the 3-Tier dropdown with clear visual badges.
  * Auto-select #1 Top Match if slot is empty.
* **Enhance `QuickFillPanel.tsx`**:
  * Auto-populate the highest affinity teacher when a subject is picked.
* **Enhance `TimetableConfigEditor.tsx`**:
  * Class Teacher selector gives highest priority to staff marked `is_class_teacher_eligible` + same wing.

### Phase 4: Primary School "Class Teacher Quick Fill" (Special UX)
* In School mode for Class 1 & 2:
  * Add a 1-click button: **"Assign Class Teacher to Core Slots"**.
  * Instantly fills all regular academic periods with the selected Class Teacher, leaving special periods (PE, Library) open.

---

## 6. Verification & Quality Gates

1. **Schema Integrity:** Verify migration executes cleanly with zero downtime and rollback support.
2. **Type Safety:** `npm run tsc --noEmit` verifies all frontend and backend contracts.
3. **Cross-Institution Testing:**
   - [x] **School:** Create a Primary teacher with `[Maths, Science]` and assign across Class 1-3.
   - [x] **College:** Create a CSE professor with `[Data Structures]` and test cross-teaching in Mechanical.
   - [x] **Training:** Create a Full-Stack trainer with `[React, Node]` and assign to a weekend batch.
   - [x] **Substitute Case:** Confirm an administrator can still assign *any* staff to *any* slot via search without error.
