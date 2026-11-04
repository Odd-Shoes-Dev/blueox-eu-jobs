import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt="Blue OX" className="h-10 mb-4 brightness-0 invert" />
            <p className="text-gray-300 font-inter text-sm">
              Connecting skilled workers with European opportunities. Your trusted partner for Blue Collar jobs in Europe.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-orbitron font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 font-inter text-sm text-gray-300">
              <li><Link to="/" className="hover:text-coral transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-coral transition">Why Blue OX</Link></li>
              <li><Link to="/jobs" className="hover:text-coral transition">Jobs</Link></li>
              <li><Link to="/apply/student" className="hover:text-coral transition">Student Portal</Link></li>
              <li><Link to="/apply/workforce" className="hover:text-coral transition">Workforce Portal</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-2">
            <h4 className="font-orbitron font-bold mb-4">Contact Us</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 font-inter">
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 mt-1 text-coral" />
                <div>
                  <p>Netherlands: +31 97010209759</p>
                  <p>Uganda: +256 200 91 34 32</p>
                  <p>Warsaw: +48 666 250 547</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-1 text-coral" />
                <div>
                  <p>Solec 24, Warsaw Poland, 00-456</p>
                  <p>Johan Huizingalaan 763a, 1066 VH Amsterdam</p>
                  <p>Plot 14, Eagen House, Kampala Road, Uganda</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} The Blue OX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
