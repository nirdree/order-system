'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api-client';

export default function SignupPage() {
  const router = useRouter();
  const [isDevelopment, setIsDevelopment] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if in development mode
    const devMode = process.env.NEXT_PUBLIC_Mode === 'development';
    setIsDevelopment(devMode);
    setIsChecking(false);

    // If not in development, redirect to login
    if (!devMode) {
      router.replace('/login');
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isDevelopment) {
    return null; // Will redirect to login
  }

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    salary: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await authAPI.signup(form);

      if (!data.success) {
        setMessage(data.message || 'Signup failed');
      } else {
        setMessage('Signup successful ✅');
        setForm({
          name: '',
          email: '',
          password: '',
          role: 'staff',
          phone: '',
          salary: ''
        });
      }
    } catch (err) {
      setMessage('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {/* Development Mode Badge */}
      <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1">
        <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
        Development Mode
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-2">Signup</h1>
        <p className="text-xs text-blue-600 mb-4 font-semibold">🔧 Development Mode Only</p>

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="input"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="input"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="input"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="input"
        >
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="input"
        />

        <input
          name="salary"
          type="number"
          placeholder="Salary"
          value={form.salary}
          onChange={handleChange}
          className="input"
        />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded mt-3"
        >
          {loading ? 'Creating...' : 'Signup'}
        </button>

        {message && (
          <p className="text-center text-sm mt-3">{message}</p>
        )}
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 8px;
          margin-bottom: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
}
