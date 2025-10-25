import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../assets/Logo.svg'

const LoginForm = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login(formData.email, formData.password);
            // Navigation will be handled by the AuthContext and App routing
        } catch (error) {
            setError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                            />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id='password' 
                                name='password' 
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                            />
                        </div>
                        <div className='text-right'><Link to="/recover" className='text-blue-600'>Forgotten Password</Link></div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className='bg-blue-600 py-4 px-8 rounded-lg text-white w-fit hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Logging in...' : 'Log In'}
                        </button>
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