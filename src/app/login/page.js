// LoginPage.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkIfAdmin = async (userId) => {
    try {
      const adminDoc = await getDoc(doc(db, "admins", userId));
      return adminDoc.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Cari user berdasarkan username
      let q = query(collection(db, "users"), where("username", "==", form.username));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        q = query(collection(db, "admins"), where("username", "==", form.username));
        querySnapshot = await getDocs(q);
      }
      else if(querySnapshot.empty){
        alert("Username not found");
        setLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const email = userData.email;

      // Login pakai email yang ditemukan
      const userCredential = await signInWithEmailAndPassword(auth, email, form.password);
      const user = userCredential.user;

      // Check if user is admin
      const isAdmin = await checkIfAdmin(user.uid);

      if (isAdmin) {
        console.log("Admin login detected, redirecting to /admin");
        router.push("/admin");
      } else {
        router.push("/home");
      }
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black flex justify-center items-center bg-gradient-to-b from-[#EDE4D4] to-[#c4a772]">
      <div className="flex items-center gap-12">
        <div className="text-center">
          <Image src="/logo wefarm.png" alt="WeFarm Logo" width={300} height={300} />
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg w-80 text-center">
          <h2 className="text-2xl font-semibold mb-6">Log In</h2>
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
                disabled={loading}
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded mb-2 gap-3 relative">
              <Lock size={20} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="bg-transparent w-full outline-none"
                required
                disabled={loading}
              />
              <span
                className="absolute right-3 cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            <Link href="#" className="block text-right text-sm text-gray-600 mb-4">
              Forgot Password?
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
            <p className="text-sm mt-4">
<<<<<<< HEAD
              Don't have an account?{" "}
=======
              Don`t have an account?{" "}
>>>>>>> fixingError10
              <Link href="/signup" className="font-bold text-green-800">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}