import { signIn } from 'next-auth/react'
import * as React from 'react'
import cls from 'classnames'
import { useSession } from 'next-auth/react'
import { FaInfoCircle, FaQuestionCircle, FaSpinner } from 'react-icons/fa'
import { Fathom, EVENTS } from '~/components/hooks/useFathom'

export default function Auth({ fathom }: { fathom: Fathom }) {
  const { data: session } = useSession()
  React.useEffect(() => {
    if (session) {
      window.location.replace('/')
    }
  }, [session])
  const [type, setType] = React.useState('signin')
  return (
    <div className="flex flex-col gap-5 justify-center items-center py-10 w-full">
      <div className="flex flex-row mx-auto rounded-lg overflow-hidden font-trajan">
        <button
          onClick={() => setType('signin')}
          className={cls('px-4 py-1 bg-brown-brushed hover:opacity-100', { 'opacity-70': type !== 'signin' })}
        >
          Sign In
        </button>
        <button
          onClick={() => setType('register')}
          className={cls('px-2 py-1 bg-brown-brushed hover:opacity-100', { 'opacity-70': type !== 'register' })}
        >
          Register
        </button>
      </div>
      {type === 'signin' ? <SigninForm fathom={fathom} /> : <RegisterForm fathom={fathom} />}
    </div>
  )
}

function SigninForm({ fathom }: { fathom: Fathom }) {
  const [error, setError] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  return (
    <form
      className="flex flex-col gap-2 max-w-sm w-full bg-brown-brushed mx-auto items-center text-white px-2 pt-2 pb-4 drop-shadow-xl rounded-md"
      onSubmit={async (e) => {
        try {
          e.preventDefault()
          setLoading(true)
          const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement | null)?.value.trim()
          const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement | null)?.value.trim()
          const result = await signIn('credentials', { redirect: false, username, password, type: 'signin' })
          fathom.trackGoal(EVENTS.Signin, 0)
          if (result?.ok) {
            window.location.replace('/')
          } else {
            setError(true)
          }
        } catch (e) {
          setError(true)
        } finally {
          setLoading(false)
        }
      }}
    >
      <h1 className="font-trajan text-3xl text-center">Sign In</h1>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Username</span>
        <input
          className="text-black px-2 py-1 rounded-md"
          name="username"
          type="text"
          placeholder="Username"
          required
        />
      </label>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Password</span>
        <input
          className="text-black px-2 py-1 rounded-md"
          name="password"
          type="password"
          placeholder="Your password"
          required
          minLength={8}
        />
      </label>
      <button
        disabled={loading}
        type="submit"
        className="flex flex-row justify-center items-center bg-slate-600 rounded-md px-2 py-1 font-trajan mt-2 w-full"
      >
        {loading ? <FaSpinner className="animate-spin" /> : 'Sign In'}
      </button>
      {error ? (
        <div className="text-red-600 text-center text-sm font-trajan pb-2 w-full">
          There was an error, please try again.
        </div>
      ) : null}
    </form>
  )
}

function RegisterForm({ fathom }: { fathom: Fathom }) {
  const [error, setError] = React.useState<boolean | string>(false)
  const [loading, setLoading] = React.useState(false)
  return (
    <form
      className="flex flex-col gap-2 max-w-sm w-full bg-brown-brushed mx-auto items-center text-white px-2 pt-2 pb-4 drop-shadow-xl rounded-md"
      onSubmit={async (e) => {
        try {
          e.preventDefault()
          const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement | null)?.value.trim()
          const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement | null)?.value.trim()
          const confirmPassword = (
            e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement | null
          )?.value.trim()
          const lodestoneUrl = (
            e.currentTarget.elements.namedItem('lodestoneUrl') as HTMLInputElement | null
          )?.value.trim()
          if (password !== confirmPassword) {
            setError("Passwords don't match, please check what you've entered")
            setLoading(false)
            return
          } else if (password && password.length < 8) {
            setError('Password too short, must be over 8 characters')
            setLoading(false)
            return
          }
          const result = await signIn('credentials', {
            redirect: false,
            username,
            password,
            confirmPassword,
            lodestoneUrl,
            type: 'register',
          })
          fathom.trackGoal(EVENTS.Register, 0)
          if (result?.ok) {
            window.location.replace('/')
          } else {
            setError(true)
          }
        } catch (e) {
          setError(true)
        } finally {
          setLoading(false)
        }
      }}
    >
      <h1 className="font-trajan text-3xl text-center">Register</h1>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Username</span>
        <input
          className="text-black px-2 py-1 rounded-md"
          name="username"
          type="text"
          placeholder="Username"
          required
          minLength={3}
        />
      </label>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Lodestone URL</span>
        <input className="text-black px-2 py-1 rounded-md" name="lodestoneUrl" type="text" placeholder="https://" />
      </label>
      <span className="flex flex-row gap-1 justify-center items-center text-sm text-opacity-85 text-white text-center -mt-1.5 mb-1 w-full">
        <FaQuestionCircle /> This is optional, connects character image etc
      </span>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Password</span>
        <input
          className="text-black px-2 py-1 rounded-md"
          name="password"
          type="password"
          placeholder="Secure password"
          required
          minLength={8}
        />
      </label>
      <span className="flex flex-row gap-1 justify-center items-center text-sm text-opacity-85 text-white text-center -mt-1 mb-1 w-full">
        <FaInfoCircle /> Minimum length 8 characters
      </span>
      <label className="flex flex-row gap-1 items-center justify-center w-full">
        <span className="w-1/2 px-2">Confirm Password</span>
        <input
          className="text-black px-2 py-1 rounded-md"
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minLength={8}
        />
      </label>
      <button
        disabled={loading}
        type="submit"
        className="flex flex-row justify-center items-center bg-slate-600 rounded-md px-2 py-1 font-trajan mt-2 w-full"
      >
        {loading ? <FaSpinner className="animate-spin" /> : 'Register'}
      </button>
      {error ? (
        <div className="text-red-600 text-center text-sm font-trajan pb-2 w-full">
          {typeof error === 'string' ? error : 'There was an error, please try again.'}
        </div>
      ) : null}
    </form>
  )
}
