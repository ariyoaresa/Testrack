import React from 'react'
import AuthLeft from '../components/AuthLeft'
import LoginForm from '../components/LoginForm'

const Login = () => {
  return (
    <div className='flex md:gap-4 p-6'>
        <AuthLeft />
        <LoginForm />
    </div>
  )
}

export default Login