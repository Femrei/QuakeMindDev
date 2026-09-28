import docx,sys
from docx.oxml.ns import qn
d=docx.Document(sys.argv[1])
body=d.element.body
out=[];pi=0;ti=0
for el in body.iterchildren():
    if el.tag==qn('w:p'):
        p=docx.text.paragraph.Paragraph(el,d)
        t=p.text
        img=len(el.findall('.//'+qn('w:drawing')))
        om=len(el.findall('.//{http://schemas.openxmlformats.org/officeDocument/2006/math}oMath'))
        tag=f"[P{pi}|{p.style.name}]"+(f"[IMG{img}]" if img else "")+(f"[EQ{om}]" if om else "")
        if t.strip() or img or om: out.append(tag+" "+t)
        pi+=1
    elif el.tag==qn('w:tbl'):
        tb=docx.table.Table(el,d)
        out.append(f"[TABLO{ti}]")
        for r in tb.rows:
            cells=[]
            prev=None
            for c in r.cells:
                if c._tc is prev: continue
                prev=c._tc; cells.append(c.text.replace('\n',' / '))
            out.append("  | "+" | ".join(cells))
        ti+=1
open(sys.argv[2],'w',encoding='utf-8').write("\n".join(out))
print(pi,ti,len(out))
