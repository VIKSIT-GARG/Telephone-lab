"""Build a credential-free source archive for download."""
from pathlib import Path
import zipfile
import os
ROOT=Path(__file__).resolve().parents[1]
SKIP={'.git','.openai','.venv','__pycache__','.pytest_cache','node_modules','runs','.next','.vinext','.wrangler','.sites-runtime','dist','outputs'}
target=ROOT/'public/lab/telephone-lab-source.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for base,dirs,files in os.walk(ROOT):
        dirs[:]=sorted(d for d in dirs if d not in SKIP)
        if os.getenv('SOURCE_SKIP_ACTIVE_EVAL')=='true' and Path(base)==ROOT/'results/real' and 'full' in dirs:dirs.remove('full')
        for name in sorted(files):
            p=Path(base)/name
            r=p.relative_to(ROOT)
            if p.suffix in ('.zip','.tsbuildinfo'):continue
            if p.name.startswith(('.env','.dev.vars')) and p.name!='.env.example':continue
            z.write(p,Path('telephone-lab')/r)
    z.writestr('telephone-lab/runs/.gitkeep','')
print(target)
