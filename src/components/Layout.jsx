import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import UserMenu from './UserMenu'
import { useLiff } from '../contexts/LiffContext'
import Loading from './Loading'

export default function Layout() {
  const { isReady } = useLiff()

  if (!isReady) {
    return <Loading />
  }

  return (
    <>
      <UserMenu />
      <Outlet />
      <BottomNav />
    </>
  )
}
