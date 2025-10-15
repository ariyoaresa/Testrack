import React from 'react'
import AuthLeft from '../components/AuthLeft'
import SignupForm from '../components/SignupForm'

const Signup = () => {
  return (
    <div className='flex md:gap-4 p-6'>
        <AuthLeft />
        <SignupForm />
    </div>
  )
}

export default Signup