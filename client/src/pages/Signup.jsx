import React from 'react'
import AuthLeft from '../components/AuthLeft'
import SignupForm from '../components/SignupForm'

const Signup = () => {
  return (
    <div className='min-h-screen flex flex-col md:flex-row md:gap-4 p-4 md:p-6'>
        <AuthLeft />
        <SignupForm />
    </div>
  )
}

export default Signup