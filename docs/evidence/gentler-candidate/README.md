# Non-adopted low-risk transition candidate

Only background exposure changed from .14 to .28, reducing the brightness jump
at imperfect moving matte edges. The genuine IC-Light reference was reused for
exactly the same source (hash-checked); no new reference/model was generated.
Automatic neural people masks and optical flow were re-executed over all 120
frames. Source timing/dimensions and actual B comparison were validated.

Measured compositing/export/comparison: 142.356 s CPU, 1.422 GiB process RAM;
output film SHA256 dfe508707cc827eee2929601767949addc90b90deceb0c881b902cf401578ef5.
Reference-generation timings in run.json are the prior actual image run and are
not included in this candidate's measured time.

Reviewed beginning, middle, end and all frames. Lower contrast reduces boundary
visibility somewhat; matte artifacts remain, and this does not clearly improve
over B. **Not adopted.** Both production engine defaults and the final B showcase
remain unchanged. This is not physical relighting or finished cinematography.
Source/model credits remain in ../subject-aware-v1/CREDITS.md.
