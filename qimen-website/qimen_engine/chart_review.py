"""以人工核对的截图转录与排盘引擎逐字段对照。"""
from analyze import PALACE_NAME
from pan_engine import get_xun_head, void_map

HEADER_FIELDS = ('四柱','局式','旬首','旬空地支','值符','值使')
PALACE_FIELDS = ('天盘','地盘','星','门','神','空','马')
PALACE_IDS = {name: number for number, name in PALACE_NAME.items()}
LIST_FIELDS = {'四柱','旬空地支','值符','值使','天盘','地盘'}


def snapshot(chart, header):
    """地盘主干、寄干与本包九宫展示采用相同顺序。"""
    gp = dict(chart['gp'])
    receiver = 8 if chart['yg'] else 2
    gp[receiver] += gp[5]
    columns = {name: {'天盘':list(chart['tp'].get(p, ())), '地盘':list(gp[p]),
                      '星':chart['stars'].get(p, ''), '门':chart['gates'].get(p, ''),
                      '神':chart['gods'].get(p, ''), '空':p in chart['void'], '马':p == chart['horse']}
               for p, name in PALACE_NAME.items()}
    head = get_xun_head(chart['hgz'])
    return {'盘头':{'四柱':[chart[k] for k in ('ygz','mgz','rgz','hgz')], '局式':header['ju_name'],
                   '旬首':head, '旬空地支':list(void_map[head]),
                   '值符':[chart['zhifu_star'],PALACE_NAME[chart['zf_pal']]],
                   '值使':[chart['zhishi_gate'],PALACE_NAME[chart['zs']]]},
            '九宫':columns}


def comparable(field, value):
    if field in LIST_FIELDS and isinstance(value, (tuple, list)):
        return tuple(sorted(value) if field == '旬空地支' else value)
    return value


def compare_chart(transcription, reference=None):
    """未知用 None，已明确的空白用 [] 或 ''，空马用布尔值。"""
    headers = transcription.get('盘头', {})
    columns = transcription.get('九宫', {})
    if set(transcription) - {'盘头', '九宫'} or set(headers) - set(HEADER_FIELDS):
        raise ValueError('截图转录的顶层或盘头字段无效')
    if set(columns) - set(PALACE_IDS):
        raise ValueError('截图九宫名须用坎1、坤2、震3、巽4、中5、乾6、兑7、艮8、离9')
    for row in columns.values():
        if set(row) - set(PALACE_FIELDS):
            raise ValueError('截图宫位字段须用天盘、地盘、星、门、神、空、马')
    fields = [('盘头', name, headers.get(name)) for name in HEADER_FIELDS]
    fields += [(pal, label, columns.get(pal, {}).get(label))
               for pal in PALACE_IDS for label in PALACE_FIELDS]
    confirmed, unknown, differences = [], [], []
    for location, field, value in fields:
        name = f'{location}/{field}'
        if value is None:
            unknown.append(name)
            continue
        if reference is None:
            continue
        row = reference['盘头'] if location == '盘头' else reference['九宫'][location]
        expected = row[field]
        if comparable(field, value) == comparable(field, expected):
            confirmed.append(name)
        else:
            differences.append({'位置':location,'字段':field,'截图':value,'引擎':expected})
    status = ('仅截图转录' if reference is None else '存在差异' if differences
              else '部分核对' if unknown else '全部一致')
    return {'状态':status, '一致':confirmed, '未读或未提供':unknown,
            '差异':differences, '截图原读':transcription}
