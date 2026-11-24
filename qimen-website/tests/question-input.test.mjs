import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareQuestions } from '../src/lib/questionInput.js'

test('allows separate positive questions and preserves their order', () => {
  assert.deepEqual(prepareQuestions('尾款能否收回？\n合同能否签成？').questions, ['尾款能否收回？','合同能否签成？'])
})
test('asks for clarification on reverse wording and combined questions', () => {
  assert.ok(prepareQuestions('尾款会不会收不回来？').error)
  assert.ok(prepareQuestions('合同能否签成，钱能否收回？').error)
})
test('does not claim to interpret an empty or overly long list', () => {
  assert.deepEqual(prepareQuestions('').questions, [])
  assert.ok(prepareQuestions('一\n二\n三\n四\n五\n六').error)
})
