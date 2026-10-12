"""One bounded compositing experiment; cached genuine SAME-INPUT reference only.

No new model, no production-engine change. Reduce background/foreground contrast
from .14 to .28 to inspect border visibility against the owner's actual B.
"""
from pathlib import Path
import shutil,sys,json
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'kaggle/experiments'))
import subject_cinematography as engine
out=ROOT/'artifacts/gentler-subject-candidate'
if (out/'subject-aware.mp4').exists():raise RuntimeError('Preserve previous evidence; choose a new output directory')
out.mkdir(parents=True,exist_ok=True)
reference=ROOT/'docs/evidence/subject-aware-v1'
for name in ('ic-light-reference.png','reference.json'):shutil.copy2(reference/name,out/name)
base=engine.composite_frame
engine.composite_frame=lambda source,alpha,field:base(source,alpha,field,background_exposure=.28)
report=engine.process(ROOT/'public/demo-performance.mp4',out,ROOT/'docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4',cache=ROOT.parent/'.cache/cinema-models')
report.update(referenceReusedForSameInput=True,newImageReferenceGeneration=False,candidateChange='Only background exposure .14 -> .28; lower matte-boundary contrast',adopted=False,visualImprovement='Pending whole-clip inspection; B remains primary showcase')
(out/'run.json').write_text(json.dumps(report,indent=2)+'\n')
