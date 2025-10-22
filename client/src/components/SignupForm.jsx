import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../assets/Logo.svg'

const SignupForm = () => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            await register(formData.email, formData.password, formData.name);
            // Navigation will be handled by the AuthContext and App routing
        } catch (error) {
            setError(error.message || 'Registration failed. Please try again.');
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
        <div className='w-[45vw] relative h-[calc(100vh-42px)] flex items-center justify-center'>
            <Link to="/login" className='bg-blue-700 text-white p-4 rounded-lg absolute top-0 right-0'>Login</Link>
            <div className='flex items-center justify-center'>
                <div>
        <div className='relative flex-1 h-auto md:h-[calc(100vh-42px)] flex items-center justify-center'>
            <Link to="/" className='bg-blue-700 text-white p-3 md:p-4 rounded-lg absolute top-4 right-4'>Login</Link>
            <div className='flex items-center justify-center w-full'>
                <div className='w-full max-w-md px-2 md:px-0'>
                    <img src={Logo} alt="Testrack" className='mb-3' />
                    <div>
                        <h2 className='font-bold text-2xl'>Create Account</h2>
                        <p className='text-gray-400 mb-2'>Let's get you set up — it only takes a minute.</p>
                    </div>
                    
                    {error && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
                            <p className='text-red-800 text-sm'>{error}</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
                        <div className='flex flex-col'>
                            <label htmlFor="name">Full Name</label>
                            <input 
                                type="text" 
                                id='name' 
                                name='name' 
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                            />
                        </div>
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
                                minLength="6"
                                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                            />
                        </div>
                        <div className='flex flex-col'>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input 
                                type="password" 
                                id='confirmPassword' 
                                name='confirmPassword' 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className='border border-gray-400 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className='bg-blue-600 py-4 px-8 rounded-lg text-white w-fit hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
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