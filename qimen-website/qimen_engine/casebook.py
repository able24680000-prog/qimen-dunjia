"""案例记录按原断、事后反馈两层保存。接口使用事务和唯一编号。"""
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone

KINDS = {'核盘样本', '事前判断', '事后转录'}
RESULTS = {'命中', '未命中', '部分符合', '结果未知', '无从评价'}


def _open(path):
    db = sqlite3.connect(path, timeout=10)
    db.execute('PRAGMA foreign_keys=ON')
    db.execute('CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, kind TEXT, original TEXT, recorded TEXT)')
    db.execute('CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(id), status TEXT, note TEXT, observed TEXT)')
    return db


def record(path, case_id, kind, original):
    """original 记录来源、盘面；事前判断还需保存可检验的原话与观察窗口。"""
    required = ['来源','盘面']
    if kind == '事前判断':
        required += ['问题','原断','可观察结果','观察窗口','失效条件']
    if kind not in KINDS or not case_id.strip() or any(not original.get(k) for k in required):
        raise ValueError('缺案例类别、编号或原始字段：' + '、'.join(required))
    data = json.dumps(original, ensure_ascii=False, sort_keys=True)
    with closing(_open(path)) as db, db:
        db.execute('INSERT INTO cases VALUES (?,?,?,?)',
                   (case_id,kind,data,datetime.now(timezone.utc).isoformat()))


def feedback(path, feedback_id, case_id, status, note, observed):
    if status not in RESULTS or not all(x.strip() for x in (feedback_id, case_id, note, observed)):
        raise ValueError('反馈须有编号、观察日期、事实描述和状态')
    with closing(_open(path)) as db, db:
        row = db.execute('SELECT kind FROM cases WHERE id=?',(case_id,)).fetchone()
        if not row:
            raise ValueError('原记录不存在')
        if row[0] != '事前判断' and status not in {'无从评价','结果未知'}:
            raise ValueError('核盘与事后转录不计作事前命中')
        db.execute('INSERT INTO feedback VALUES (?,?,?,?,?)',(feedback_id,case_id,status,note,observed))


def read_case(path, case_id):
    with closing(_open(path)) as db:
        row = db.execute('SELECT kind, original, recorded FROM cases WHERE id=?',(case_id,)).fetchone()
        if not row:
            raise KeyError(case_id)
        logs = db.execute('SELECT id,status,note,observed FROM feedback WHERE case_id=? ORDER BY rowid',(case_id,)).fetchall()
    return {'类别':row[0],'原始记录':json.loads(row[1]),'首次登记':row[2],'历次反馈':logs}
