import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Shopaholics Inc" className="h-8 w-8 object-contain" />
              <span className="font-bold gradient-text">Shopaholics Inc.</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Professional, customer-obsessed, with just enough sarcasm to keep it real.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/category/electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link to="/category/fashion" className="hover:text-white">Fashion</Link></li>
              <li><Link to="/category/home-kitchen" className="hover:text-white">Home & Kitchen</Link></li>
              <li><Link to="/category/beauty-health" className="hover:text-white">Beauty & Health</Link></li>
              <li><Link to="/category/pets-outdoors" className="hover:text-white">Pets & Outdoors</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-white">Create Account</Link></li>
              <li><Link to="/account/orders" className="hover:text-white">My Orders</Link></li>
              <li><Link to="/account/wishlist" className="hover:text-white">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Help</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Share on X</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Shopaholics Inc. All rights reserved. (Legally, we have to say that.)
          </p>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Powered by caffeine and questionable life choices.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
