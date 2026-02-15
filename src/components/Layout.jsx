import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useLiff } from '../contexts/LiffContext'
import Loading from './Loading'

export default function Layout() {
  const { isReady } = useLiff()

  if (!isReady) {
    return <Loading />
  }

  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
