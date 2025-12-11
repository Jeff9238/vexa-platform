import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-vexa-blue-dark text-white pt-16 pb-24 md:pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">VEXA</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Malaysia's Premier Hybrid Marketplace for Properties, Vehicles, and Professional Services.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-vexa-orange transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-vexa-orange transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-vexa-orange transition-colors"><Twitter size={20} /></a>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Properties</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/buy" className="hover:text-white">Buy Property</Link></li>
              <li><Link href="/rent" className="hover:text-white">Rent Property</Link></li>
              <li><Link href="/new-launch" className="hover:text-white">New Launches</Link></li>
              <li><Link href="/commercial" className="hover:text-white">Commercial</Link></li>
            </ul>
          </div>

          {/* Vehicles */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Vehicles</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/cars" className="hover:text-white">Used Cars</Link></li>
              <li><Link href="/recon" className="hover:text-white">Recon Cars</Link></li>
              <li><Link href="/motorcycles" className="hover:text-white">Motorcycles</Link></li>
              <li><Link href="/ev" className="hover:text-white">Electric Vehicles</Link></li>
            </ul>
          </div>

          {/* Services & Support */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/services" className="hover:text-white">Find a Pro</Link></li>
              <li><Link href="/agents" className="hover:text-white">Agent Directory</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing & Ads</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Vexa Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}