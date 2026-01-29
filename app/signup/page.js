'use client';

import { useState } from 'react';

export default function SignupPage() {
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">Signup</h1>

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
