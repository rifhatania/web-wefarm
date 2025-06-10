"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase"; // pastikan ini sesuai path

export default function SignupPageAdmin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      await setDoc(doc(db, "admins", user.uid), {
        uid: user.uid,
        email: form.email,
        password: form.password,
        username: form.username,
        phone: form.phone,
        createdAt: new Date(),
        role: "admin"
      });

      alert("Sign up successful. Please log in.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen text-black flex justify-center items-center bg-gradient-to-b from-[#EDE4D4] to-[#c4a772]">
      <div className="flex items-center gap-12">
        <div className="text-center">
          <Image src="/logo wefarm.png" alt="WeFarm Logo" width={300} height={300} />
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg w-80 text-center">
          <h2 className="text-2xl font-semibold mb-6">Sign Up as Admin</h2>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-4 gap-3">
              <User size={20} />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                className="bg-transparent w-full outline-none"
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-4 gap-3">
              <Phone size={20} />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="bg-transparent w-full outline-none"
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-4 gap-3">
              <Mail size={20} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="bg-transparent w-full outline-none"
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-4 gap-3 relative">
              <Lock size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password (min 8 chars)"
                className="bg-transparent w-full outline-none"
                required
              />
              <span
                className="absolute right-3 cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-6 gap-3 relative">
              <Lock size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="bg-transparent w-full outline-none"
                required
              />
              <span
                className="absolute right-3 cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
            >
              Sign Up
            </button>
            <p className="text-sm mt-4">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-green-800">
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
