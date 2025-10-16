import React from 'react'
import Logo from '../assets/Sub-Logo 1.png'

const AuthLeft = () => {
  return (
    <div className='hidden md:block md:flex-1'>
        <div className='bg-[url("/src/assets/Authimg.jpg")] bg-center bg-cover rounded-lg h-[40vh] md:h-[calc(100vh-42px)] p-6 md:p-8 md:w-auto relative'>
            <div><img src={Logo} alt="Logo" /></div>
            <div className='text-white absolute bottom-6 left-6 right-6'>
                <h2 className='text-2xl md:text-3xl font-bold'>Master Your Testnet Journey</h2>
                <p className='text-sm md:text-base'>Stay ahead with organized tracking, smart reminders, and seamless wallet management — all in one place.</p>
            </div>
        </div>
    </div>
  )
}

export default AuthLeft