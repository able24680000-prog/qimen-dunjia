// The rule engine is not a natural-language interpreter. Ask for clarification
// when the target or polarity cannot be mapped safely to its success/failure signal.
export function prepareQuestions(value) {
  const text = value.trim()
  if (!text) return { questions: [] }
  const questions = text.split(/[\n；;]+/).map(q => q.trim()).filter(Boolean)
  if (questions.length > 5) return { error: '一次最多分析五个事项，请分批输入。' }
  for (const q of questions) {
    const negative = /(?:不回来|不成功|不通过|不会|不能|无法|失败|落空|丢失|破裂|离婚|下雨|生病|亏损|赔钱|输掉|失业)/.test(q.replace(/能不能/g, '能否').replace(/会不会/g, '是否'))
    if (negative) return { error: `“${q}”的判断方向需要明确。请改为积极结果的单一问题，例如“尾款能否收回”，避免将规则中的成败误解为问题的肯定或否定。` }
    if ((q.match(/[？?]/g) || []).length > 1 || /(?:以及|并且|同时|然后|，还|,还|，.*能否|,.*能否)/.test(q)) return { error: '检测到可能包含多个事项。请每行填写一个完整问题，再分别分析。' }
  }
  return { questions }
}
