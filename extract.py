import os

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

def extract_func(func_name):
    start = content.find(f'def {func_name}():')
    if start == -1: return ''
    end = content.find('\ndef ', start + 1)
    if end == -1: end = len(content)
    lines = content[start:end].split('\n')
    body_lines = []
    for line in lines[1:]:
        if line.startswith('    '):
            body_lines.append(line[4:])
        elif line == '':
            body_lines.append('')
        else:
            body_lines.append(line)
    return '\n'.join(body_lines)

os.makedirs('pages', exist_ok=True)

header = 'import streamlit as st\nfrom core import *\n\n'

with open('pages/1_🛰️_Uydu_Hasar_Analizi.py', 'w', encoding='utf-8') as f:
    f.write(header + 'st.set_page_config(page_title="Uydu Hasar Analizi", layout="wide")\nboot_resources()\n' + extract_func('render_road_screen'))

with open('pages/2_📝_Afet_NLP.py', 'w', encoding='utf-8') as f:
    f.write(header + 'st.set_page_config(page_title="Afet NLP", layout="wide")\nboot_resources()\n' + extract_func('render_nlp_screen'))

with open('pages/3_📈_Deprem_Risk.py', 'w', encoding='utf-8') as f:
    f.write(header + 'st.set_page_config(page_title="Deprem Risk Paneli", layout="wide")\nboot_resources()\n' + extract_func('render_risk_screen'))

with open('pages/5_🚑_Operasyon_Merkezi.py', 'w', encoding='utf-8') as f:
    f.write(header + 'st.set_page_config(page_title="Acil Operasyon Merkezi", layout="wide")\nboot_resources()\n' + extract_func('render_operations_screen'))

with open('pages/6_📷_Kamera_Tespiti.py', 'w', encoding='utf-8') as f:
    f.write(header + 'st.set_page_config(page_title="Kamera Tespiti", layout="wide")\nboot_resources()\n' + extract_func('render_camera_screen'))
