import dbConnect from '../db/mongo'
import ChallengeOption from '../db/models/challengeOption'
import { ChallengeOption as TChallengeOption } from '../types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const data = require('../../data/questions.json')

const DIFFICULTY_MAP = {
  beginner: 'easy',
  intermediate: 'normal',
  expert: 'hard',
}

// eslint-disable-next-line @typescript-eslint/no-extra-semi
;(async () => {
  console.info('[start]')
  await dbConnect()
  console.info('[questions][new]', { count: data.length })
  const challengeOptions = new Set(
    (await ChallengeOption.find({}, { question: 1 }).lean<TChallengeOption[]>()).map((o) => o.question)
  )
  console.info('[questions][existing]', { count: challengeOptions.size })
  for (const item of data) {
    if (challengeOptions.has(item.question)) {
      console.info(item.question, 'exists, skip')
      continue
    } else {
      console.info('Adding', item.question)
      const option: Omit<TChallengeOption, '_id'> = {
        question: item.question,
        options: item.options,
        difficulty: DIFFICULTY_MAP[item.difficulty] || DIFFICULTY_MAP.beginner,
        spoilers: [],
      }
      await ChallengeOption.create(option)
    }
  }
  console.info('[end]')
})()
  .catch((e) => console.error('[error]', e))
  .finally(() => process.exit(0))
