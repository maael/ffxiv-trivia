import Image from 'next/image'
import Link from 'next/link'
import { FaUser, FaSignOutAlt, FaArrowRight, FaPencilAlt } from 'react-icons/fa'
import { useSession, signOut } from 'next-auth/react'
import logoImg from '../../../public/logo.png'
import { ADMINS, avatar, getUserStyles } from '~/util'
import cls from 'classnames'

export default function Header() {
  const { data: session } = useSession()
  const userStyles = getUserStyles(session?.user?.name, (session?.user as any)?.style)
  const isAdmin = ADMINS.includes(`${session?.user?.name}`)
  return (
    <div>
      <div className="max-w-6xl w-full overflow-hidden mx-auto h-12 px-1 py-2 flex flex-row gap-2 sm:gap-5 items-center text-white">
        <Link href="/">
          <div className="flex flex-row gap-2 h-full items-center flex-1">
            <div className="relative h-full aspect-square">
              <Image src={logoImg} layout="fill" />
            </div>
            <a>
              <h1 className="font-trajan text-xl hidden sm:block">FFXIV Trivia</h1>
            </a>
          </div>
        </Link>
        <Link href="/game/random">
          <button className="font-trajan bg-brown-brushed rounded-full px-4 py-1 hover:scale-110 transition-transform drop-shadow-lg flex flex-row gap-1 justify-center items-center h-full">
            Play <FaArrowRight />
          </button>
        </Link>
        {session ? (
          <Link href={`/user/${session.user?.name}`}>
            <div className="cursor-link font-trajan flex flex-row gap-2 justify-center items-center bg-brown-brushed rounded-full px-2 py-1 hover:scale-110 transition-transform drop-shadow-lg h-full">
              <Image
                src={avatar(session.user?.image)}
                width={20}
                height={20}
                className={cls('rounded-full', userStyles.border)}
              />
              <span className={cls('hidden sm:block text-ellipsis whitespace-nowrap overflow-hidden', userStyles.text)}>
                {(session.user as any)?.lodestoneData?.name || session.user?.name}
              </span>
            </div>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href={`/questions`}>
            <div className="cursor-link font-trajan flex flex-row gap-2 justify-center items-center bg-brown-brushed rounded-full px-4 py-1 hover:scale-110 transition-transform drop-shadow-lg h-full">
              <FaPencilAlt />
              <span className="hidden sm:block">Edit</span>
            </div>
          </Link>
        ) : null}
        {session ? (
          <button
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.assign('/')
            }}
            className="font-trajan flex flex-row gap-2 justify-center items-center bg-brown-brushed rounded-full px-4 py-1 hover:scale-110 transition-transform drop-shadow-lg h-full"
          >
            <span className="hidden sm:block">Sign Out</span>
            <FaSignOutAlt />
          </button>
        ) : (
          <Link href="/auth">
            <div className="cursor-link font-trajan flex flex-row gap-2 justify-center items-center bg-brown-brushed rounded-full px-4 py-1 hover:scale-110 transition-transform drop-shadow-lg h-full">
              <FaUser />
              <span className="hidden sm:block">Sign In | Register</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
