import re,collections
t=open('makale.txt',encoding='utf-8').read()
import re as _r; body,refs=_r.split(r'\[P\d+\|Heading 1\] KAYNAKLAR',t)
# kaynak atıfları
cited=set()
for m in re.finditer(r'\[(\d+(?:\s*[,–-]\s*\d+)*)\]',body):
    for part in re.split(r',',m.group(1)):
        part=part.strip()
        if re.match(r'^\d+\s*[–-]\s*\d+$',part):
            a,b=map(int,re.split(r'[–-]',part)); cited.update(range(a,b+1))
        elif part.isdigit(): cited.add(int(part))
refn=[int(x) for x in re.findall(r'\[P\d+\|Normal\] \[(\d+)\]',refs)]
print('kaynak sayısı',len(refn),'atıfsız:',sorted(set(refn)-cited),'listede yok:',sorted(cited-set(refn)))
# başlıklar
caps=collections.OrderedDict()
for kind in ['Tablo','Şekil']:
    capt=[int(x) for x in re.findall(r'\|Normal\](?:\[IMG\d\])? '+kind+r' (\d+)\. ',body)]
    capt+= [int(x) for x in re.findall(r'/ '+kind+r' (\d+)\. ',body)]
    print(kind,'başlıkları',sorted(capt))
    refd=collections.Counter(int(x) for x in re.findall(kind+r'\s+(\d+)',body))
    print(kind,'atıf yapılan',sorted(refd), 'başlıksız atıf:',sorted(set(refd)-set(capt)))
eqs=[int(x) for x in re.findall(r'\n\t\((\d+)\)',body)]
print('denklemler',eqs)
print('denklem atıf',sorted(set(int(x) for x in re.findall(r'Denklem\s*\(?(\d+)',body))))
heads=re.findall(r'\|Heading \d\] ([\d\.]+)',body)
print('başlıklar',heads)
bref=sorted(set(re.findall(r'Bölüm (\d+(?:\.\d+)*)',body)),key=lambda s:[int(x) for x in s.split('.')])
print('bölüm atıfları',bref)
hs=set(h.rstrip('.') for h in heads)
print('olmayan bölüm:',[b for b in bref if b not in hs])
print('Algoritma:',sorted(set(re.findall(r'Algoritma (\d+)',body))))
print('5.3 harf atıfları',sorted(set(re.findall(r'5\.3\(([a-z])\)',body))))
print('Sınırlılık harfleri',sorted(set(re.findall(r'Sınırlılık \(([a-z])\)',body))))
