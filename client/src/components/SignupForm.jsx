import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.svg'

const SignupForm = () => {
    return (
        <div className='w-[45vw] relative h-[calc(100vh-42px)] flex items-center justify-center'>
            <Link to="/" className='bg-blue-700 text-white p-4 rounded-lg absolute top-0 right-0'>Login</Link>
            <div className='flex items-center justify-center'>
                <div>
                    <img src={Logo} alt="Testrack" className='mb-3' />
                    <div>
                        <h2 className='font-bold text-2xl'>Create Account</h2>
                        <p className='text-gray-400 mb-2'>Let’s get you set up — it only takes a minute.</p>
                    </div>
                    <form className='flex flex-col gap-2'>
                        <div className='flex flex-col'>
                            <label htmlFor="name">Full Name</label>
                            <input type="name" id='name' name='name' className='border border-gray-400 rounded-lg p-2' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id='email' name='email' className='border border-gray-400 rounded-lg p-2' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="password">Password</label>
                            <input type="password" id='password' name='password' className='border border-gray-400 rounded-lg p-2' />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="confirmpassword">Confirm Password</label>
                            <input type="password" id='confirmpassword' name='confirmpassword' className='border border-gray-400 rounded-lg p-2' />
                        </div>
                        <button type="submit" className='bg-blue-600 py-4 px-8 rounded-lg text-white w-fit hover:bg-blue-700 cursor-pointer'>Create Account</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SignupForm