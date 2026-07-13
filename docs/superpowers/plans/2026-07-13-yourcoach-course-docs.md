# YourCoach Course Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained Chinese, project-based course repository for the 38-stage YourCoach WeChat fitness-coach booking platform.

**Architecture:** The repository is documentation-first. `course/` holds one Markdown lesson per stage, grouped by learning sequence; `docs/` holds the shared curriculum, writing standard, and project-document templates; `scripts/audit-course.mjs` checks the lesson inventory, mandatory lesson headings, baseline content depth, and internal course links.

**Tech Stack:** Markdown, Git, Node.js standard library.

## Global Constraints

- Use simplified Chinese and explain specialist terms at first use.
- Keep the 38 lesson identifiers `00` through `37`; do not merge or remove a required stage.
- Lessons `00` to `04` are fully written; lessons `05` to `37` are structured skeletons with a goal, prerequisites, acceptance criteria, and all fixed-template headings.
- Every development lesson includes a copyable Codex prompt with role, task, context, allowed scope, forbidden scope, functional, security, test, acceptance, and report requirements.
- Do not include actual AppIDs, payment keys, certificates, phone numbers, personal data, or unsupported claims about fees, review times, or changing WeChat rules.
- Course content must label changing WeChat-platform rules with: `执行时请以微信公众平台当前页面和官方文档为准。`
- Do not create application, payment, cloud-function, or production business code in this round.

---

### Task 1: Repository entry documents, templates, curriculum map, and audit

**Files:**
- Create: `README.md`, `AGENTS.md`, `docs/课程总纲.md`, `docs/课程写作规范.md`
- Create: `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/USER_FLOWS.md`, `docs/PAGE_MAP.md`, `docs/ORDER_STATE.md`, `docs/DATA_MODEL.md`, `docs/API.md`, `docs/SECURITY.md`, `docs/TEST_PLAN.md`, `docs/DEPLOYMENT.md`, `docs/RELEASE_CHECKLIST.md`, `docs/OPERATIONS.md`
- Create: `scripts/audit-course.mjs`

**Interfaces:**
- Consumes: the fixed 38-file lesson path inventory defined in `docs/课程总纲.md`.
- Produces: repository navigation and an executable audit that exits non-zero if the inventory or mandatory headings are missing.

- [ ] **Step 1: Write the audit expectations before the course documents**

Create an expected path array for all 38 files and the 20 fixed template headings. Require each course file to exist; require all headings; require files `00`–`04` to include `### 步骤 1` and be at least 1,500 UTF-16 code units; validate that every relative Markdown link in `docs/课程总纲.md` resolves.

- [ ] **Step 2: Add repository documents and project-document starter templates**

Document the course scope, required safety rules, lesson writing standard, full curriculum mapping, and purpose plus fill-in structure for every project document.

- [ ] **Step 3: Run the audit before lesson files exist**

Run: `node scripts/audit-course.mjs`

Expected: non-zero exit with a missing-course-file error.

- [ ] **Step 4: Commit the repository foundation**

Run: `git add README.md AGENTS.md docs scripts && git commit -m "docs: add course foundation"`

### Task 2: Write the full foundational lessons

**Files:**
- Create: `course/00-导学与学习方法/00-课程使用说明与最终成果.md`
- Create: `course/00-导学与学习方法/01-理解微信小程序生态.md`
- Create: `course/01-主体账号与合规准备/02-企业主体与资质准备.md`
- Create: `course/01-主体账号与合规准备/03-注册微信小程序账号.md`
- Create: `course/01-主体账号与合规准备/04-开通微信云开发.md`

**Interfaces:**
- Consumes: the course standard and paths from Task 1.
- Produces: five standalone beginner lessons satisfying every fixed-template heading and the audit’s detailed-course thresholds.

- [ ] **Step 1: Write each lesson with ordered, verifiable actions**

Use the fixed 20-section template. Include official-platform caveats, page actions, expected results, safe placeholder configuration, copyable Codex prompts, and a course-specific checklist.

- [ ] **Step 2: Run the course audit**

Run: `node scripts/audit-course.mjs`

Expected: non-zero exit that reports only missing skeleton lessons.

- [ ] **Step 3: Commit the foundational lessons**

Run: `git add course/00-导学与学习方法 course/01-主体账号与合规准备 && git commit -m "docs: add foundation lessons"`

### Task 3: Create structured skeletons for lessons 05–37

**Files:**
- Create: the 33 remaining paths defined in `docs/课程总纲.md`.

**Interfaces:**
- Consumes: the exact path list, heading contract, and global constraints.
- Produces: one complete fixed-template skeleton per remaining stage, each with stage-specific objective, prerequisites, output, acceptance criteria, and a scoped copyable Codex prompt.

- [ ] **Step 1: Create the directory groups and lesson skeletons**

Use the stage names and paths from `docs/课程总纲.md`. Give each skeleton all 20 headings and do not make claims that require live platform verification.

- [ ] **Step 2: Run the audit and fix every reported error**

Run: `node scripts/audit-course.mjs`

Expected: `课程审计通过：38 节课程、20 个固定栏目、5 节完整基础课、课程总纲链接均有效。`

- [ ] **Step 3: Commit the remaining lesson skeletons**

Run: `git add course && git commit -m "docs: add remaining course skeletons"`

### Task 4: Final course quality gate

**Files:**
- Modify only if verification identifies a concrete defect.

**Interfaces:**
- Consumes: all committed course documentation and audit script.
- Produces: evidence that the first-round scope satisfies the requested sequence.

- [ ] **Step 1: Run the full audit and inspect Git status**

Run: `node scripts/audit-course.mjs && git status --short && git log --oneline --decorate -4`

Expected: audit success and no unintended tracked files.

- [ ] **Step 2: Verify the scope manually**

Check that the curriculum includes enterprise registration, mini-program registration, cloud development, payment, user/coach/admin surfaces, data, backend, security, testing, deployment, filing, review, publication, and operations; verify only lessons `00`–`04` have full prose.

- [ ] **Step 3: Publish the intended branch**

Run: `git remote add origin https://github.com/lansedetange/YourCoach-Course.git && git push -u origin codex/course-docs`

Expected: branch appears on the stated GitHub repository.
