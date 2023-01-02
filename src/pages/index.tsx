import Link from 'next/link'
import * as React from 'react'
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'
import { FaArrowRight, FaBeer, FaCogs, FaGithub, FaLink, FaReddit } from 'react-icons/fa'
import dynamic from 'next/dynamic'
import { CHALLENGE } from '~/types'
import PrizeList from '~/components/PrizeList'
import GamesBlock from '~/components/primitives/GamesBlock'

const Countdown = dynamic(() => import('../components/primitives/RankedResetTimer'), {
  ssr: false,
  loading: () => null,
})

export default function Index(_: any) {
  const { data, isLoading } = useQuery(['home-info'], () => fetch('/api/internal/home_info').then((r) => r.json()))
  const {
    daily,
    weekly,
    monthly,
    recentDailyGames,
    highDailyGames,
    recentWeeklyGames,
    highWeeklyGames,
    recentMonthlyGames,
    highMonthlyGames,
    recentRandomGames,
  } = data || {}
  return (
    <>
      <div className="flex flex-col justify-center items-center text-white">
        <div className="flex flex-col gap-7 justify-center items-center max-w-5xl w-full sm:text-lg px-2">
          <div className="text-2xl sm:text-4xl text-center mt-3 sm:mt-7 font-trajan">
            Think you know Final Fantasy XIV?
          </div>
          <div className="flex flex-col justify-center items-center gap-2 w-full px-2 my-1">
            <Link href="/game/random">
              <a className="-mt-2 text-2xl text-center bg-brown-brushed rounded-full drop-shadow-md hover:scale-110 transition-transform px-5 py-1 flex flex-row gap-2 justify-center items-center">
                Quick Game <FaArrowRight />
              </a>
            </Link>
            <p className="max-w-xs text-center -mt-1 text-sm opacity-75">
              Play a quick game with some random questions!
            </p>
            <Link href="/game/custom">
              <a className="mt-4 text-2xl text-center bg-brown-brushed rounded-full drop-shadow-md hover:scale-110 transition-transform px-5 py-1 flex flex-row gap-2 justify-center items-center">
                Custom Game <FaCogs />
              </a>
            </Link>
            <p className="max-w-xs text-center -mt-1 text-sm opacity-75">
              Make a shareable game with fixed questions, perfect for friend groups or sharing with stream viewers!
            </p>
            <div className="font-trajan text-xl sm:text-3xl mt-2">Ranked Games</div>
            <div className="text-center max-w-md">
              <Link href="/auth">
                <a className="underline">Sign up or Log in</a>
              </Link>{' '}
              to play fixed ranked games!
            </div>
            <div className="text-center max-w-md my-1">
              You can only attempt each ranked game once until a new one is released, so play carefully!
            </div>
            <div className="font-trajan flex flex-col sm:flex-row gap-1 text-center my-2 text-2xl">
              Time until new Ranked game: <Countdown />
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-2">
              <RankedGameBlock type={CHALLENGE.daily} challenge={daily} />
              <RankedGameBlock type={CHALLENGE.weekly} challenge={weekly} />
              <RankedGameBlock type={CHALLENGE.monthly} challenge={monthly} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 w-full">
            <GamesBlock type="time" games={recentRandomGames} isLoading={isLoading} label={'Recent Quick Games'} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 w-full">
            <GamesBlock type="time" games={recentDailyGames} isLoading={isLoading} label={'Recent Daily'} />
            <GamesBlock type="score" games={highDailyGames} isLoading={isLoading} label={'High Score Daily'} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 w-full">
            <GamesBlock type="time" games={recentWeeklyGames} isLoading={isLoading} label={'Recent Weekly'} />
            <GamesBlock type="score" games={highWeeklyGames} isLoading={isLoading} label={'High Score Weekly'} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-5 w-full">
            <GamesBlock type="time" games={recentMonthlyGames} isLoading={isLoading} label={'Recent Monthly'} />
            <GamesBlock type="score" games={highMonthlyGames} isLoading={isLoading} label={'High Score Monthly'} />
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="max-w-3xl mx-auto mt-2 text-white pt-2 pb-1 text-xs flex flex-row gap-5 justify-center items-end text-center">
        <span className="flex flex-row gap-1 justify-center items-center">
          <a href="https://mael.tech">Made by Matt Elphick</a>
          <a href="https://mael.tech">
            <FaLink />
          </a>
          <a href="https://github.com/maael">
            <FaGithub />
          </a>
          <a href="http://reddit.com/u/maael">
            <FaReddit />
          </a>
        </span>
        <span className="flex flex-row gap-1 justify-center items-center">Mael'a Niwa [Zodiark] in game</span>
      </div>
      <div className="max-w-3xl mx-auto text-white pb-2 text-xs flex flex-row gap-5 justify-center items-end text-center">
        <a href="https://www.buymeacoffee.com/matte" className="flex flex-row gap-1 justify-center items-center">
          Enjoying the game? Get me a beer. <FaBeer />
        </a>
      </div>
    </>
  )
}

function RankedGameBlock({
  type,
  challenge,
}: {
  type: CHALLENGE
  challenge: { error?: string; name: string; prizes: any }
}) {
  return challenge && !challenge.error ? (
    <div className="flex flex-col gap-1 items-center">
      <h3 className="font-trajan text-2xl -mb-0.5">{type}</h3>
      <PrizeList prizes={challenge?.prizes} />
      <Link href={`/game/${type}`}>
        <a className="text-center bg-brown-brushed rounded-full drop-shadow-md hover:scale-110 transition-transform px-5 py-1 flex flex-row gap-1 items-center justify-center">
          {challenge?.name.replace(`${new Date().getFullYear()}`, '').trim()} <FaArrowRight />
        </a>
      </Link>
    </div>
  ) : null
}

export async function getStaticProps() {
  const queryClient = new QueryClient()

  const rootUrl =
    process.env.VERCEL_ENV === 'production'
      ? 'https://gw2-geoguesser.mael.tech'
      : process.env.VERCEL_ENV === 'preview'
      ? 'https://gw2-geoguesser.mael.tech'
      : 'http://localhost:3002'

  console.info('[revalidate]', rootUrl)

  await queryClient.prefetchQuery(['home-info'], async () => {
    try {
      const result = await fetch(`${rootUrl}/api/internal/home_info`).then((r) => r.json())
      return result
    } catch (e) {
      console.error('error', e)
    }
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      revalidate: 10, // 10s
    },
  }
}
