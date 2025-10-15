import React from 'react'
import RecoverPassword from '../components/RecoverPassword'
import AuthLeft from '../components/AuthLeft'

const RecoverPass = () => {
  return (
    <div className='flex md:gap-4 p-6'>
        <AuthLeft />
        <RecoverPassword />
    </div>
  )
}

export default RecoverPass