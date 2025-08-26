import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground w-full">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold">ExpertConnect</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Connecting you with verified experts across multiple domains for professional consultation and guidance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categories" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Find Experts
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/become-expert" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Become an Expert
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/category/automobile-advice" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Automobile Advice
                </Link>
              </li>
              <li>
                <Link to="/category/electronic-devices" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Electronic Devices
                </Link>
              </li>
              <li>
                <Link to="/category/home-appliance" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Home Appliances
                </Link>
              </li>
              <li>
                <Link to="/category/education-career" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                  Education & Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-secondary" />
                <span className="text-primary-foreground/80">support@expertconnect.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-secondary" />
                <span className="text-primary-foreground/80">+94 11 234 5678</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-secondary mt-0.5" />
                <span className="text-primary-foreground/80">
                  123 Business District<br />
                  Colombo 03, Sri Lanka
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-primary-foreground/80 text-sm">
              © 2024 ExpertConnect. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                Terms of Service
              </Link>
              <Link to="/support" className="text-primary-foreground/80 hover:text-secondary transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;