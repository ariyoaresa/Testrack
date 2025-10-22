import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.svg'

const SignupForm = () => {
    return (
        <div className='relative flex-1 h-auto md:h-[calc(100vh-42px)] flex items-center justify-center'>
            <Link to="/" className='bg-blue-700 text-white p-3 md:p-4 rounded-lg absolute top-4 right-4'>Login</Link>
            <div className='flex items-center justify-center w-full'>
                <div className='w-full max-w-md px-2 md:px-0'>
                    <img src={Logo} alt="Testrack" className='mb-3' />
                    <div>
                        <h2 className='font-bold text-2xl'>Create Account</h2>
                        <p className='text-gray-400 mb-2'>Let’s get you set up — it only takes a minute.</p>
                    </div>
                    <form className='flex flex-col gap-3'>
                        <div className='flex flex-col'>
                            <label htmlFor="name">Full Name</label>
                            <input type="name" id='name' name='name' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id='email' name='email' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="password">Password</label>
                            <input type="password" id='password' name='password' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="confirmpassword">Confirm Password</label>
                            <input type="password" id='confirmpassword' name='confirmpassword' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <button type="submit" className='bg-blue-600 py-3 md:py-4 px-6 md:px-8 rounded-lg text-white w-full md:w-fit hover:bg-blue-700 cursor-pointer'>Create Account</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SignupForm