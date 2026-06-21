import { Link } from "react-router-dom";
import { FiGithub, FiTwitter, FiLinkedin } from "react-icons/fi";

const Footer = () => (
  <footer className="bg-gray-950 border-t border-gray-800 py-10 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <span className="text-xl font-bold text-cyan-400 font-mono">MERN Starter</span>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            A full-stack starter template with role-based access, Firebase auth, and MongoDB.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <div className="space-y-2">
            <Link to="/" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">Home</Link>
            <Link to="/blogs" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">Blogs</Link>
            <Link to="/categories" className="block text-gray-400 hover:text-cyan-400 text-sm transition-colors">Categories</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Connect</h4>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><FiGithub size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><FiTwitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors"><FiLinkedin size={20} /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} MERN Starter. Built with ❤️ using React & Node.js
      </div>
    </div>
  </footer>
);

export default Footer;
