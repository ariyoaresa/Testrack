import React from 'react'
import AuthLeft from '../components/AuthLeft'
import LoginForm from '../components/LoginForm'

const Login = () => {
  return (
    <div className='min-h-screen flex flex-col md:flex-row md:gap-4 p-4 md:p-6'>
        <AuthLeft/>
        <LoginForm />
    </div>
  )
}

export default Login