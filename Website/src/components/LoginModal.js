import React, { useState } from 'react';

export default function LoginModal({ setIsModalOpen, handleLogin, loginFailed }) {

    const [username, setUsername] = useState();
    const [password, setPassword] = useState();

    return (
        <div className="relative">
            <div
                className="fixed inset-0 flex justify-center items-center z-50"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
                onClick={() => setIsModalOpen(false)}
            >
                <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] relative" onClick={(e) => e.stopPropagation()}>
                    {/* Close button */}
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-2 right-2 text-gray-600 hover:text-black"
                    >
                        x
                    </button>
                    <h2 className='text-2xl font-bold text-center mb-4'>
                        Admin Login
                    </h2>
                    {loginFailed && (
                        <div className="text-red-600 text-sm text-center mb-2">
                            Invalid username or password.
                        </div>
                    )}
                    <div className='grid grid-cols-1 gap-4'>
                        <label className='black mb-1 font-semibold'>Username</label>
                        <input
                            type='text'
                            className='w-full border p-2 rounded'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <label>Password</label>
                        <input
                            type='password'
                            className='w-full border p-2 rounded'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            onClick={() => handleLogin(username, password)}
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
