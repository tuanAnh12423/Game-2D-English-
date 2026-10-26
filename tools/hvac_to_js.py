"""Chuyển dữ liệu HVAC (JSON) thành file JS để game chạy được cả khi offline.
Cách dùng: thay file trong data/hvac/ rồi chạy  python3 tools/hvac_to_js.py
"""
import json, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
pairs = [
    ('data/hvac/daikin_questions.json', 'js/data/hvac_questions.js', 'HVAC_QUIZ'),
    ('data/hvac/listening.json', 'js/data/hvac_listening.js', 'HVAC_LISTEN'),
]
for src, dst, name in pairs:
    data = json.loads((root / src).read_text(encoding='utf-8'))
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    (root / dst).write_text(
        f'// Tự sinh từ {src} bằng tools/hvac_to_js.py — đừng sửa tay file này.\nwindow.{name} = {body};\n',
        encoding='utf-8')
    print('wrote', dst)
