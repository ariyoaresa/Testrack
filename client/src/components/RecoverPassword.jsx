import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../assets/Logo.svg'

const RecoverPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='w-[45vw] relative h-[calc(100vh-42px)] flex items-center justify-center'>
        <Link to="/login" className='bg-blue-700 text-white p-4 rounded-lg absolute top-0 right-0'>Login</Link>
        <div className='flex items-center justify-center'>
          <div className='text-center'>
            <img src={Logo} alt="Testrack" className='mb-3 mx-auto' />
            <div>
              <h2 className='font-bold text-2xl text-green-600'>Check Your Email</h2>
              <p className='text-gray-400 mb-4'>
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className='text-gray-500 text-sm mb-6'>
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <div className='flex gap-3 justify-center'>
                <Link 
                  to="/login" 
                  className='bg-blue-600 py-3 px-6 rounded-lg text-white hover:bg-blue-700 cursor-pointer'
                >
                  Back to Login
                </Link>
                <button 
                  onClick={() => setSuccess(false)}
                  className='bg-gray-200 py-3 px-6 rounded-lg text-gray-700 hover:bg-gray-300 cursor-pointer'
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-[45vw] relative h-[calc(100vh-42px)] flex items-center justify-center'>
      <Link to="/login" className='bg-blue-700 text-white p-4 rounded-lg absolute top-0 right-0'>Login</Link>
      <div className='flex items-center justify-center'>
        <div>
          <img src={Logo} alt="Testrack" className='mb-3' />
          <div>
            <h2 className='font-bold text-2xl'>Reset Your Password</h2>
            <p className='text-gray-400 mb-2'>Enter the email associated with your account and we'll send you instructions to reset your password.</p>
          </div>
          
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
            <div className='flex flex-col'>
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id='email' 
                name='email' 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className='bg-blue-600 py-4 px-8 rounded-lg text-white w-fit hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RecoverPassword