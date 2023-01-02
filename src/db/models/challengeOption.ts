import mongoose, { Schema, Model } from 'mongoose'
import { WithDoc, ChallengeOption } from '../../types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ItemModel extends Model<WithDoc<ChallengeOption>> {}

const itemSchema = new Schema<WithDoc<ChallengeOption>, ItemModel>({
  question: String,
  options: [
    {
      correct: Boolean,
      option: String,
    },
  ],
  difficulty: String,
  spoilers: [String],
})

const Item =
  mongoose.models.ChallengeOption || mongoose.model<WithDoc<ChallengeOption>, ItemModel>('ChallengeOption', itemSchema)

export default Item
