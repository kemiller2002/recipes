# Visual Engineering Repository Cleanup and Document Architecture

You are an autonomous repository-maintenance and information-architecture agent working inside the **Visual Engineering repository**.

Your assignment is to inspect every document in the repository, determine what each document is, identify duplicates and obsolete files, reorganize the documents into a coherent structure, and clean up the repository.

You must also conduct a detailed evaluation of the `input-documents/` folder. This folder is the intake area where documents are initially generated or deposited before they are reviewed, normalized, processed, and moved into their permanent locations.

Your goal is not merely to make the repository look cleaner.

Your goal is to create a repository structure that:

- Preserves research history and provenance
- Is understandable to humans and autonomous agents
- Distinguishes raw inputs from processed knowledge
- Prevents duplicate and orphaned documents
- Supports continued autonomous research
- Makes documents easy to locate, search, maintain, and publish
- Preserves the Research Execution Package hierarchy and stable identifiers
- Establishes a repeatable document-ingestion lifecycle

Work independently. Make reasonable decisions without asking for permission unless an action could cause irreversible loss and no safe alternative exists.

---

# Core Safety Rule

Do not permanently delete potentially valuable research content merely because it appears redundant, outdated, poorly named, or misplaced.

Prefer, in order:

1. Preserve the canonical version.
2. Merge unique information into the canonical version.
3. Redirect references to the canonical version.
4. Move superseded material to an archive.
5. Delete only files proven to be exact or functionally empty duplicates.

Use Git history and a dedicated cleanup branch as the primary rollback mechanism.

---

# Required Git Workflow

Before changing files:

1. Confirm that the working tree is understood.
2. Record the current branch and repository status.
3. Do not overwrite unrelated uncommitted user work.
4. Create a dedicated branch such as:

```text
repo/document-architecture-cleanup
```

5. Capture the pre-cleanup repository structure.
6. Make small, logically grouped commits rather than one opaque bulk commit.

Suggested commit sequence:

```text
chore(docs): add repository document inventory
refactor(docs): establish canonical document architecture
refactor(docs): normalize input document workflow
chore(docs): consolidate confirmed duplicates
chore(docs): repair internal document references
docs(repo): add maintenance and ingestion guidance
```

Do not push, merge, or open a pull request unless the surrounding environment explicitly instructs you to do so.

---

# Authoritative Research Model

Preserve and support this canonical artifact hierarchy:

1. Scientific Research Journal
2. Research Execution Package
3. Theory Registry
4. Evidence Registry

Associated stable identifier prefixes include:

| Artifact | Prefix |
|---|---|
| Research Package | `RP-` |
| Journal Entry | `JR-` |
| Evidence | `EV-` |
| Hypothesis | `HY-` |
| Theory | `TH-` |
| Experiment | `EX-` |
| Decision Framework | `DF-` |
| Concept | `CN-` |
| Glossary | `GL-` |

Do not casually rename stable identifiers already referenced elsewhere.

A document containing one of these identifiers is not a disposable duplicate merely because another file covers similar material.

---

# Phase 1: Inspect the Repository Before Modifying It

Recursively inspect the repository, including:

- Markdown files
- Plain-text documents
- YAML, JSON, TOML, and configuration files related to documents
- Generated HTML or other published representations
- Scripts that create, transform, index, or publish documents
- Templates
- Registries
- Research journals
- Research Execution Packages
- Evidence and theory files
- Archived documents
- Hidden files that affect document processing
- README files
- Agent instructions
- CI workflows related to documentation
- The complete contents and substructure of `input-documents/`

Ignore normal dependency, cache, build, and version-control directories unless they directly affect document handling.

Examples include:

```text
.git/
node_modules/
dist/
build/
.cache/
coverage/
vendor/
```

Inspect repository-specific ignore files before deciding what is generated or authoritative.

---

# Phase 2: Build a Complete Document Inventory

Create a machine-readable and human-readable inventory before moving or deleting anything.

For every relevant document, record where possible:

- Current path
- Filename
- File type
- Size
- Content hash
- Title
- Stable identifier
- Artifact type
- Research area
- Discipline
- Version
- Status
- Confidence
- Completion
- Priority
- Creation or stated document date
- Last Git modification information
- Related projects
- Related documents
- Supersedes
- Superseded by
- Tags
- Keywords
- Whether references point to it
- Whether it points to missing documents
- Whether it appears generated
- Whether it is canonical
- Whether it is an input, working document, processed artifact, registry, publication, template, or archive
- Duplicate group, when applicable
- Recommended disposition
- Reason for the recommendation

Do not rely only on filenames. Read the contents.

Recommended inventory outputs:

```text
docs/repository-maintenance/document-inventory.md
docs/repository-maintenance/document-inventory.json
```

Use the repository’s existing conventions instead if an established maintenance area already exists.

---

# Phase 3: Classify Every Document

Assign each document to one primary lifecycle class:

## Intake

Newly generated, imported, or deposited documents that have not yet been reviewed.

## Working

Documents actively being refined but not yet accepted as canonical.

## Canonical

The authoritative version of an artifact.

## Registry

Theory, evidence, hypothesis, glossary, decision-framework, concept, experiment, or index records.

## Journal

Chronological research records and investigative notes.

## Research Package

Completed or versioned Research Execution Packages.

## Derived Publication

Reports, websites, books, presentations, HTML pages, or other outputs generated from canonical artifacts.

## Template

Reusable structures, schemas, prompts, examples, or scaffolding.

## Operational

Instructions, workflows, automation scripts, contribution guidance, and repository maintenance documentation.

## Archive

Superseded material retained for provenance, historical reconstruction, or recovery.

## Generated

Reproducible outputs that should normally not be edited manually.

## Unknown

Documents that cannot yet be classified safely.

Do not force ambiguous documents into an incorrect category. Record uncertainty explicitly.

---

# Phase 4: Evaluate Duplicate and Overlapping Documents

Use multiple levels of duplicate detection.

## Level 1: Exact Duplicates

Files with identical normalized contents or identical hashes.

These may usually be consolidated safely after checking:

- References
- Metadata
- Path significance
- Build scripts
- Publication dependencies

## Level 2: Formatting-Only Duplicates

Files whose substantive content is the same but formatting, whitespace, metadata order, or line wrapping differs.

Select the version that best preserves:

- Complete metadata
- Stable identifiers
- Citation traceability
- Newer valid corrections
- Repository conventions

## Level 3: Version Duplicates

Documents representing older and newer versions of the same artifact.

Do not automatically delete older versions.

Determine whether the older version should be:

- Preserved as an explicitly versioned historical record
- Moved to an archive
- Replaced by Git history
- Merged because it contains unique material
- Marked as superseded

## Level 4: Semantic Overlap

Documents that discuss similar subjects but contain different reasoning, evidence, hypotheses, decisions, or historical context.

These are not duplicates by default.

Determine whether they should remain separate, be cross-linked, or be carefully merged.

## Level 5: Fragments and Partial Copies

Files that contain incomplete sections of a larger document.

Before removing them, verify whether they contain:

- Unique claims
- Unique sources
- Failed hypotheses
- Research journal history
- Decisions
- Open questions
- Metadata
- Stable identifiers
- Agent handoff information

---

# Duplicate Decision Standard

A file may be deleted only when all of the following are true:

- Its content is completely preserved elsewhere.
- It contains no unique metadata or research history.
- It is not the target of a required reference.
- It is not required by a script, build, index, or publication process.
- Its removal does not break stable identifiers.
- Git history provides adequate recovery.
- The deletion is recorded in the cleanup report.

When these conditions are not met, archive or merge it instead.

---

# Canonical-Version Selection

When several documents compete to be canonical, evaluate:

1. Stable identifier continuity
2. Explicit canonical status
3. Completeness
4. Valid version information
5. Evidence traceability
6. Research journal continuity
7. Unique information
8. Accuracy
9. Current relevance
10. Number and importance of inbound references
11. Compatibility with repository automation
12. Conformance to the Research Execution Package specification

Do not assume the newest modification timestamp means the file is authoritative. A newly copied old document can appear newer than the true canonical source.

Document every nontrivial canonicalization decision.

---

# Phase 5: Deep Evaluation of `input-documents/`

Treat `input-documents/` as an ingestion boundary, not as a permanent dumping ground.

Determine:

- What currently enters the folder
- Which agents, people, scripts, or systems place files there
- Whether naming conventions exist
- Whether files contain metadata
- Whether files are processed automatically
- Whether processing state is visible
- Whether processed files remain behind
- Whether files are duplicated elsewhere
- Whether documents become orphaned
- Whether failed processing is detectable
- Whether provenance is preserved
- Whether there are conflicting versions
- Whether scripts assume the current location
- Whether the folder contains permanent canonical artifacts that should be moved
- Whether files can be reprocessed safely
- Whether partial writes or unfinished generations are possible
- Whether the folder is suitable for concurrent agent use

Inspect both the documents and all code or workflows that interact with this directory.

---

# Required Input-Document Lifecycle

Design and implement the clearest structure compatible with the repository.

A strong default model is:

```text
input-documents/
├── README.md
├── incoming/
├── processing/
├── needs-review/
├── rejected/
└── archive/
```

However, do not impose this exact structure when a simpler or more compatible design is better.

The lifecycle should make these states explicit:

```text
incoming
→ validated
→ classified
→ normalized
→ deduplicated
→ processed
→ moved to canonical destination
→ indexed
→ archived or removed from intake
```

Failures should move to a visible review state rather than silently disappearing.

A document should not remain indefinitely in the incoming area after successful processing.

---

# Input-Document Requirements

Establish or recommend:

## Naming

A deterministic naming convention that reduces collisions and preserves traceability.

For example:

```text
YYYY-MM-DD-HHMM-[research-area]-[document-type]-[short-title].md
```

Do not rename documents with stable identifiers in a way that breaks identifier continuity.

## Metadata

Define minimum intake metadata, such as:

```yaml
---
title:
document_type:
research_area:
discipline:
source:
source_agent:
created_at:
processing_status: incoming
intended_destination:
related_documents: []
tags: []
---
```

Use existing repository schemas where available instead of creating competing standards.

## Validation

Validate:

- Required metadata
- Encoding
- Parseable front matter
- Filename collisions
- Duplicate content
- Known artifact type
- Stable identifier format
- Internal links
- Intended destination

## Provenance

Preserve:

- Original filename
- Original source
- Intake timestamp
- Source agent or process
- Original content hash
- Processing decisions
- Final destination
- Canonical identifier

## Idempotency

Reprocessing the same unchanged input should not create repeated copies.

Use hashes, identifiers, or an ingestion manifest to detect repeated submissions.

## Atomicity

Avoid leaving half-processed files in canonical locations.

Where practical:

1. Validate the input.
2. Generate the normalized artifact in a temporary or processing area.
3. Verify it.
4. Move it atomically to the final destination.
5. Update indexes.
6. Record completion.
7. Remove or archive the intake copy.

## Concurrency

Consider whether multiple autonomous agents may add or process files simultaneously.

Reduce:

- Filename collisions
- Competing canonical versions
- Duplicate processing
- Overwritten files
- Incomplete index updates

---

# Phase 6: Design the Target Repository Architecture

Infer the correct architecture from the actual contents rather than forcing a generic structure.

A possible conceptual structure is:

```text
docs/
├── research/
│   ├── journals/
│   ├── packages/
│   ├── evidence/
│   ├── hypotheses/
│   ├── theories/
│   ├── experiments/
│   ├── decision-frameworks/
│   ├── concepts/
│   └── glossary/
├── disciplines/
├── synthesis/
├── publications/
├── templates/
├── operations/
├── repository-maintenance/
└── archive/
```

This is a starting hypothesis, not a mandatory answer.

Preserve useful structures already present.

Optimize for:

- Clear canonical locations
- Minimal ambiguity
- Predictable paths
- Stable identifiers
- Easy cross-linking
- Autonomous-agent comprehension
- Searchability
- Website generation
- Low maintenance burden
- Separation of source artifacts and generated outputs
- Separation of active and archived research
- Separation of intake and permanent storage

Avoid unnecessary folder depth.

A document should have one obvious canonical home.

---

# Phase 7: Prepare a Migration Plan Before Moving Files

Before applying structural changes, produce a migration map containing:

| Current Path | Proposed Path | Action | Confidence | Reason | References Affected |
|---|---|---|---:|---|---|

Allowed actions:

- Keep
- Rename
- Move
- Merge
- Archive
- Delete exact duplicate
- Mark generated
- Needs review

Check the plan for:

- Path collisions
- Case-sensitive and case-insensitive filename collisions
- Broken relative links
- Duplicate stable identifiers
- Build-script assumptions
- Website routes
- Navigation indexes
- CI references
- Agent prompt references
- README references

Then implement the plan.

---

# Phase 8: Execute the Cleanup

Perform the repository cleanup completely.

This includes, where justified:

- Moving misplaced documents
- Renaming ambiguous files
- Normalizing filenames
- Consolidating proven duplicates
- Merging unique content carefully
- Archiving superseded files
- Removing exact or empty duplicates
- Repairing metadata
- Repairing internal links
- Updating indexes
- Updating README files
- Updating document-generation scripts
- Updating publication scripts
- Updating CI or validation workflows
- Removing empty directories
- Separating canonical sources from generated outputs
- Adding missing `.gitignore` rules for reproducible generated files
- Adding lightweight validation or linting where it materially prevents recurrence

Do not perform unrelated code refactoring.

---

# Merge Requirements

When merging documents:

- Preserve all unique information.
- Preserve evidence citations.
- Preserve hypotheses, including failed hypotheses.
- Preserve uncertainty.
- Preserve open questions.
- Preserve research-journal history.
- Preserve stable identifiers or explicitly document identifier consolidation.
- Preserve authorship and provenance.
- Preserve version relationships.
- Do not silently strengthen claims.
- Do not convert tentative ideas into established conclusions.
- Mark the surviving document as superseding the retired document when appropriate.
- Add redirects, compatibility links, or index entries where useful.

---

# Phase 9: Validate the Repository

After cleanup, run all applicable validation.

At minimum check:

- Git status
- Duplicate hashes
- Duplicate stable identifiers
- Broken Markdown links
- Broken relative paths
- Missing referenced files
- Orphaned documents
- Invalid front matter
- Empty files
- Empty directories
- Filename collisions
- Build failures
- Documentation-site generation
- Tests
- Linters
- Formatting checks
- Ingestion scripts
- Index generation
- Search/index manifests
- References to old paths

If the repository lacks validation tooling, add only lightweight, maintainable checks that provide clear value.

Do not introduce a large new toolchain solely for this cleanup.

---

# Phase 10: Document the New Operating Model

Create or update documentation explaining:

- Repository document architecture
- Canonical artifact locations
- Difference between intake, working, canonical, derived, and archived documents
- How documents enter through `input-documents/`
- Required metadata
- Processing lifecycle
- Duplicate-handling policy
- Canonical-version selection policy
- Archival policy
- Deletion policy
- Stable identifier rules
- How internal links should be written
- How generated publications relate to canonical source artifacts
- How agents should deposit new documents
- How agents should process pending documents
- How to recover from failed processing
- How to run validation
- How to find unresolved items

The `input-documents/README.md` must be operationally useful to an agent encountering the repository with no conversation history.

---

# Required Final Artifacts

Create a cleanup package containing at least:

```text
docs/repository-maintenance/
├── document-inventory.md
├── document-inventory.json
├── migration-map.md
├── duplicate-analysis.md
├── input-documents-assessment.md
├── repository-cleanup-report.md
└── unresolved-document-decisions.md
```

Adapt paths to existing repository conventions when necessary.

## `document-inventory.md`

Human-readable inventory and classification.

## `document-inventory.json`

Machine-readable inventory suitable for future scripts and agents.

## `migration-map.md`

Old paths, new paths, actions, rationale, and affected references.

## `duplicate-analysis.md`

For each duplicate group:

- Files compared
- Similarity type
- Canonical file selected
- Unique material found
- Merge performed
- Archive or deletion action
- Reasoning
- Confidence

## `input-documents-assessment.md`

Include:

- Current-state analysis
- Risks
- Existing producers and consumers
- Proposed lifecycle
- Folder design
- Metadata requirements
- Deduplication strategy
- Idempotency strategy
- Error handling
- Concurrency considerations
- Automation recommendations
- Changes implemented
- Deferred improvements

## `repository-cleanup-report.md`

Include:

- Executive summary
- Initial repository condition
- Final architecture
- Files moved
- Files renamed
- Files merged
- Files archived
- Files deleted
- Links repaired
- Metadata repaired
- Scripts changed
- Validation performed
- Test results
- Risks
- Remaining research debt
- Rollback instructions
- Recommended next steps

## `unresolved-document-decisions.md`

Record every ambiguous case you could not resolve safely.

Do not hide unresolved uncertainty.

---

# Cleanup Manifest

Also create a machine-readable change manifest, for example:

```text
docs/repository-maintenance/cleanup-manifest.json
```

Each record should include:

```json
{
  "original_path": "",
  "final_path": "",
  "action": "move",
  "content_hash_before": "",
  "content_hash_after": "",
  "canonical_identifier": "",
  "duplicate_group": null,
  "reason": "",
  "confidence": 0.0
}
```

This manifest should make the cleanup auditable and assist future automated maintenance.

---

# Decision Confidence

Assign confidence to significant decisions:

- `0.95–1.00`: Exact duplicate or mechanically certain
- `0.80–0.94`: Strong evidence
- `0.60–0.79`: Reasonable inference
- Below `0.60`: Do not delete; archive or mark for review

Do not use a numerical score as a substitute for explaining the evidence.

---

# Completion Criteria

The work is complete only when:

- Every relevant document has been inspected or explicitly excluded.
- Every document has a known classification or is listed as unresolved.
- Exact duplicates have been handled.
- Semantic overlap has been evaluated rather than blindly deleted.
- Stable identifiers remain valid.
- Canonical artifacts have clear homes.
- The intake lifecycle is documented.
- `input-documents/` no longer functions as an indefinite storage area.
- Processed inputs have an explicit disposition.
- Internal references have been repaired.
- Build and validation checks pass, or failures are fully documented.
- The repository is cleaner without losing research history.
- Another autonomous agent can understand where documents belong and how to process new ones without conversation history.
- All changes are recorded in the cleanup report and manifest.

---

# Final Response

At completion, report:

1. The final repository architecture
2. The most important structural problems discovered
3. What was moved, merged, archived, or deleted
4. The result of the `input-documents/` evaluation
5. Automation or validation added
6. Tests and checks run
7. Remaining unresolved decisions
8. Risks or potentially controversial choices
9. Commit summary
10. Exact paths to all cleanup artifacts

Do not provide only recommendations.

Inspect the repository, make the justified changes, validate the results, and leave behind a complete, auditable document-maintenance system.
