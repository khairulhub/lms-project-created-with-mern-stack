import Navbar from "./Navbar";
import Footer from "./Footer";

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-950 text-white">
    <Navbar />
    <main className="flex-1 pt-16">{children}</main>
    <Footer />
  </div>
);

export default PublicLayout;
