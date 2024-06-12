import dbConnect from '../db/mongo'
import User from '../db/models/user'
import { getLodestoneData } from '../util/lodestone'
import { getRandomImage } from '../util/random'

// eslint-disable-next-line @typescript-eslint/no-extra-semi
;(async () => {
  console.info('[start]')
  await dbConnect()
  const users = await User.find({})
  for (const user of users) {
    if (!user.lodestoneUrl) {
      console.info('[clean]', user._id, user.username)
      await User.findByIdAndUpdate(user._id, { image: getRandomImage(), lodestoneData: {} })
    } else {
      const lodestoneData = await getLodestoneData(user.lodestoneUrl)
      console.info('[update]', user._id, lodestoneData)
      await User.findByIdAndUpdate(user._id, { image: lodestoneData.image, lodestoneData })
    }
  }
  console.info('[users]', { users: users.length })
  console.info('[end]')
})()
  .catch((e) => console.error('[error]', e))
  .finally(() => process.exit(0))
