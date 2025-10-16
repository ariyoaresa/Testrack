import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.svg'

const LoginForm = () => {
    return (
        <div className='relative flex-1 h-auto md:h-[calc(100vh-42px)] flex items-center justify-center'>
            <Link to="/signup" className='bg-blue-700 text-white p-3 md:p-4 rounded-lg absolute top-4 right-4'>Create Account</Link>
            <div className='flex items-center justify-center w-full'>
                <div className='w-full max-w-md px-2 md:px-0'>
                    <img src={Logo} alt="Testrack" className='mb-3' />
                    <div>
                        <h2 className='font-bold text-2xl'>Welcome Back</h2>
                        <p className='text-gray-400 mb-2'>Welcome back, builder. Ready to organize some chaos?</p>
                    </div>
                    <form className='flex flex-col gap-3'>
                        <div className='flex flex-col'>
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id='email' name='email' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="password">Password</label>
                            <input type="password" id='password' name='password' className='border border-gray-400 rounded-lg p-3' />
                        </div>
                        <div className='text-right'><Link to="/recover" className='text-blue-600'>Forgotten Password</Link></div>
                        <button type="submit" className='bg-blue-600 py-3 md:py-4 px-6 md:px-8 rounded-lg text-white w-full md:w-fit hover:bg-blue-700 cursor-pointer'>Log In</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginForm