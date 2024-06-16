import * as React from 'react'
import { dehydrate, QueryClient, useQueries } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { avatar, cleanUsername, formatDate, getUserStyles } from '~/util'
import cls from 'classnames'
import UserLinks from '~/components/primitives/UserLinks'
import { CHALLENGE } from '~/types'

function averageScore(ar) {
  return (ar.length === 0 ? 0 : ar.reduce((acc, i) => acc + i.totalScore, 0) / ar.length).toLocaleString('en', {
    maximumFractionDigits: 0,
    useGrouping: true,
  })
}

export default function Index() {
  const { query } = useRouter()
  const [{ data: user }] = useQueries({
    queries: [
      {
        queryKey: ['user', query.username],
        queryFn: () => fetch(`/api/internal/user/${query.username}`).then((r) => r.json()),
      },
    ],
  })

  if (!user) return null

  const userStyles = getUserStyles(user.username, user.style, { large: true, animate: true })

  const quickGames = user.games.filter((g) => g.challengeType === CHALLENGE.random)
  const dailyGames = user.games.filter((g) => g.challengeType === CHALLENGE.daily)
  const weeklyGames = user.games.filter((g) => g.challengeType === CHALLENGE.weekly)
  const monthlyGames = user.games.filter((g) => g.challengeType === CHALLENGE.monthly)

  return (
    <div className="flex justify-center items-center text-white">
      <div className="flex flex-col gap-2 justify-center items-center max-w-5xl w-full px-2 sm:px-4 pt-5">
        <div className="relative aspect-square" style={{ width: '25vmin', maxWidth: 100 }}>
          <Image
            src={avatar(user.image)}
            layout="fill"
            className={cls('rounded-full drop-shadow-md', userStyles.border)}
          />
        </div>
        <div className="flex flex-row gap-2 justify-center items-center text-4xl sm:text-6xl">
          <a href={user?.lodestoneData?.url} className={cls('font-trajan', userStyles.text)}>
            {cleanUsername(user?.lodestoneData?.name || user.username)}
          </a>
          <UserLinks username={user.username} />
        </div>
        <div className="flex flex-row gap-2 justify-center items-center text-2xl sm:text-3xl">
          <span className={cls('font-trajan', userStyles.text)}>{user?.lodestoneData?.title}</span>
          <UserLinks username={user.username} />
        </div>
        {user?.lodestoneData?.freeCompany && user?.lodestoneData?.freeCompany?.name !== '' ? (
          <div className="flex flex-row gap-2 justify-center items-center">
            <div className="relative" style={{ height: 40, width: 40 }}>
              {user?.lodestoneData?.freeCompany?.crest.map((i) => (
                <img src={i} key={i} className="absolute inset-0" />
              ))}
            </div>
            <a
              className="text-center text-lg"
              href={`https://na.finalfantasyxiv.com${user?.lodestoneData?.freeCompany?.url}`}
            >
              {user?.lodestoneData?.freeCompany?.name}
            </a>
          </div>
        ) : null}
        <div
          className="flex flex-col justify-center bg-brown-brushed px-6 pt-4 pb-5 mt-2 drop-shadow-lg w-full text-xl"
          style={{ minHeight: '20vh' }}
        >
          <div className="font-trajan grid grid-cols-2 lg:grid-cols-5 text-center text-sm lg:text-base">
            <div className="flex flex-col justify-center items-center col-span-2 lg:col-span-1">
              <div>Total Games</div>
              <div className="opacity-80">{user.totalGames}</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>Avg Quick</div>
              <div className="opacity-80">{averageScore(quickGames)}</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>Avg Daily</div>
              <div className="opacity-80">{averageScore(dailyGames)}</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>Avg Weekly</div>
              <div className="opacity-80">{averageScore(weeklyGames)}</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div>Avg Monthly</div>
              <div className="opacity-80">{averageScore(monthlyGames)}</div>
            </div>
          </div>
          <div
            className="flex flex-row gap-2 px-3 py-1 text-2xl font-trajan mt-2"
            style={{
              backgroundColor: 'rgba(96, 76, 52, 0.5)',
            }}
          >
            <div className="w-1/3">Game</div>
            <div className="w-1/3 text-center">Score</div>
            <div className="w-1/3 text-right">Time</div>
          </div>
          {user.games.map((g, idx) => (
            <div
              key={g._id}
              className="flex flex-row gap-1 px-3 py-1 text-sm sm:text-lg"
              style={{
                backgroundColor: idx % 2 === 1 ? 'rgba(96, 76, 52, 0.5)' : 'rgba(55, 45, 35, 0.2)',
              }}
            >
              {g.challenge ? (
                <Link href={`/leaderboard/${g.challenge?._id}`}>
                  <a className="w-1/3">{g.challenge?.name || 'Quick Game'}</a>
                </Link>
              ) : (
                <div className="w-1/3">Quick Game</div>
              )}
              <div className="w-1/3 text-center flex justify-center items-center">
                {g.totalScore?.toLocaleString('en', { useGrouping: true })}
              </div>
              <div className="w-1/3 text-right flex justify-end items-center" suppressHydrationWarning>
                {formatDate(g.createdAt)}
              </div>
            </div>
          ))}
          <div className="font-trajan text-center mt-5 text-sm opacity-75">
            Showing {user.games.length} of {user.totalGames} games
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ params }) {
  const queryClient = new QueryClient()

  const rootUrl =
    process.env.VERCEL_ENV === 'production'
      ? 'https://ffxiv-trivia.mael.tech'
      : process.env.VERCEL_ENV === 'preview'
      ? 'https://ffxiv-trivia.mael.tech'
      : 'http://localhost:3002'

  console.info('[revalidate]', { username: params.username, rootUrl })

  await Promise.all([
    queryClient.prefetchQuery(['user', params.username], () =>
      fetch(`${rootUrl}/api/internal/user/${params.username}`).then((r) => r.json())
    ),
  ])

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      revalidate: 60, // 60s
    },
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}
