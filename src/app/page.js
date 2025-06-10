import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  return (
    <><div className="w-screen h-screen bg-white">
      <header className="bg-[#E5B961] flex justify-between items-center p-4 text-black">
        <div className="logo">
          <Image src="/logo wefarm.png" alt="WEFARM" width={100} height={100} />
        </div>
        <div className="auth-buttons flex">
          <Link href="/login" className="bg-white font-bold py-2 px-4 rounded-lg mr-2">Log In</Link>
          <Link href="/signup" className="bg-gray-300 font-bold text-black py-2 px-4 rounded-lg">Register</Link>
        </div>
      </header>
      <main className="p-6 bg-white text-black">
        <section className="intro bg-white p-6 shadow-lg rounded-lg">
          <div className="flex items-center">
            <Image
              src="/logo wefarm.png"
              alt="WeFarm"
              className="intro-logo"
              width={150}
              height={150}
            />
            <div>
              <h2 className="text-2xl font-bold">Welcome to WeFarm!</h2>
              <p className="my-2">Whether you're a beginner or a seasoned grower, we've got everything you need to make planting easier and more fun.</p>
              <p className="my-2">Track your plants, get helpful guides, and grow with a community that loves farming as much as you do.</p>
              <p className="my-2">Let's make farming simple and rewarding—one plant at a time!</p>
            </div>
          </div>
        </section>

        <h2 className="text-center text-3xl font-bold mt-8">What will you <span className="text-[#E5B961]">plant</span> today?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 px-4">
          <div className="card bg-[#C47F36] text-white text-center p-6 rounded-xl shadow-md transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold">Experiences</h3>
            <p className="mt-4">Tulis pengalaman Anda selama menanam untuk membantu pengguna lain yang ingin menanam 👨🏻‍🌾</p>
            <Image src="/experience.png" alt="Experience Ex" width={300} height={200} className="mt-4 mx-auto" />
          </div>
          <div className="card bg-gray-300 text-center p-6 rounded-xl shadow-md transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold">Tracker</h3>
            <p className="mt-4">Memonitor pertumbuhan tanaman Anda dan menyimpan semua progresnya✅</p>
            <Image src="/tracker.png" alt="Tracker Ex" width={300} height={200} className="mt-4 mx-auto" />
          </div>
          <div className="card bg-[#E5B961] text-center p-6 rounded-xl shadow-md transform transition-transform hover:scale-105">
            <h3 className="text-xl font-bold">Guides</h3>
            <p className="mt-4">Menyediakan instruksi tahapan yang memudahkan proses penanaman Anda 🌱</p>
            <Image src="/guide.png" alt="Guide Ex" width={300} height={200} className="mt-4 mx-auto" />
          </div>
        </div>
      </main>
    </div>
    </>
  );
}