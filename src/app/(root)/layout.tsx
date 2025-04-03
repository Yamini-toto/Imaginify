import React from 'react'
import Slidebar from '../../components/shared/Slidebar'
import MobileNav from '../../components/shared/MobileNav'
import { Toaster } from '../../components/ui/toaster'

const Layout = ({children}: {children: React.ReactNode}) => {
  return (
    <main className="root">
      <Slidebar />
      <MobileNav />
      <div className='root-container'>
        <div className='wrapper'>
          {children}
        </div>
      </div>
      <Toaster />
    </main>
  )
}


export default Layout