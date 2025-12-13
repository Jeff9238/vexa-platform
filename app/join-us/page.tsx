"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, User, CheckCircle2, ArrowRight, Building } from "lucide-react";

export default function JoinUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <h1 className="font-bold text-lg text-slate-800">Partner with VEXA</h1>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
          
          <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Grow Your Business</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Join thousands of professionals, agents, and developers connecting with customers every day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <User size={100} className="text-blue-600" />
                  </div>
                  <div className="relative z-10">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                          <User size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Property Agent</h3>
                      <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Unlimited Listings</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Verified Agent Badge</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Lead Management Tools</li>
                      </ul>
                      <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors w-full justify-center">
                          Register as Agent <ArrowRight size={18} />
                      </Link>
                  </div>
              </div>

              {/* Pro Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Briefcase size={100} className="text-purple-600" />
                  </div>
                  <div className="relative z-10">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                          <Briefcase size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Service Professional</h3>
                      <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Showcase Portfolio</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Direct Customer Chat</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Subscription Benefits</li>
                      </ul>
                      <Link href="/dashboard" className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors w-full justify-center">
                          Register as Pro <ArrowRight size={18} />
                      </Link>
                  </div>
              </div>

              {/* Developer Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Building size={100} className="text-slate-800" />
                  </div>
                  <div className="relative z-10">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800 mb-4">
                          <Building size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Property Developer</h3>
                      <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> List New Projects</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Brand Visibility</li>
                          <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Analytics Dashboard</li>
                      </ul>
                      <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors w-full justify-center">
                          Register as Developer <ArrowRight size={18} />
                      </Link>
                  </div>
              </div>
          </div>

          <div className="bg-slate-100 rounded-xl p-8 text-center mt-8">
              <h3 className="font-bold text-slate-800 mb-2">Need help getting started?</h3>
              <p className="text-slate-600 text-sm mb-4">Our support team is here to assist you with onboarding.</p>
              <a href="mailto:support@vexa.com" className="text-vexa-blue font-bold hover:underline">support@vexa.com</a>
          </div>

      </div>
    </div>
  );
}