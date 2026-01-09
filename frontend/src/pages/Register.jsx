import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import { hashPassword } from '../utils/crypto';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', password: '' });
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!phoneData.valid) {
            setError('Please enter a valid phone number');
            return;
        }

        try {
            const payload = {
                ...formData,
                phone: phoneData.fullNumber,
                password: formData.password
            };

            await authService.register(payload);
            alert('Registration Successful. Please Login.');
            navigate('/admin/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className="bg-white w-full max-w-[440px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto">
                <h2 className="m-0 mb-8 text-3xl font-bold text-center text-slate-900 tracking-tight">New Admin Registration</h2>
                {error && <p className="bg-red-50 border border-red-200 text-error py-3 px-4 rounded-xl text-sm text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Ex. John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">Phone Number</label>
                        <PhoneInput onChange={setPhoneData} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <button type="submit" className="mt-4 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40">Create Account</button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-slate-500">Already have an account? </span>
                    <Link to="/admin/login" className="text-primary font-semibold no-underline">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
