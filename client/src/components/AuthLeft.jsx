import React from 'react'
import Logo from '../assets/Sub-Logo 1.png'

const AuthLeft = () => {
  return (
    <div>
        <div className='bg-[url("/src/assets/Authimg.jpg")] bg-center bg-cover rounded-lg h-[calc(100vh-42px)] p-8 w-[45vw] relative'>
            <div><img src={Logo} alt="Logo" /></div>
            <div className='text-white absolute bottom-6'>
                <h2 className='text-3xl font-bold'>Master Your Testnet Journey</h2>
                <p>Stay ahead with organized tracking, smart reminders, and seamless wallet management — all in one place.</p>
            </div>
        </div>
    </div>
  )
}

export default AuthLeft