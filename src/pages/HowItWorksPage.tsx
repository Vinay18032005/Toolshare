import { Link } from 'react-router-dom';
import { Search, Calendar, ShieldCheck, Star, ArrowRight, Wrench, Users, Package } from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
          How ToolShare Works
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          ToolShare connects workshop owners and electricians so they can share
          idle equipment locally — saving money and building community trust.
        </p>
      </div>

      {/* For Borrowers */}
      <div className="mb-16">
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          For Borrowers
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Search & Filter', desc: 'Find equipment by category, price range, city, or distance. See real-time availability and owner ratings.' },
            { icon: Calendar, title: 'Book Your Dates', desc: 'Send a booking request for the dates you need. The owner approves, and you pay the rental fee plus a refundable deposit.' },
            { icon: ShieldCheck, title: 'Use & Return Safely', desc: 'Upload condition photos at pickup and return. Your deposit is refunded automatically when the return is confirmed.' },
          ].map((step, i) => (
            <div key={i} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* For Lenders */}
      <div className="mb-16">
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          For Lenders
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Wrench, title: 'List Your Equipment', desc: 'Add photos, set your rental rate and deposit, and write a description. Your listing goes live instantly.' },
            { icon: Calendar, title: 'Manage Bookings', desc: 'Approve or reject incoming requests. Block out dates when your equipment is unavailable.' },
            { icon: Star, title: 'Earn & Build Trust', desc: 'Get paid for each rental. Build your reputation with ratings from satisfied borrowers.' },
          ].map((step, i) => (
            <div key={i} className="card p-6">
              <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Safety */}
      <div className="card p-8 bg-gradient-to-br from-brand-50 to-white dark:from-gray-900 dark:to-gray-950">
        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Trust & Safety
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: ShieldCheck, title: 'Security Deposits', desc: 'Refundable deposits protect lenders against damage and are automatically returned on safe return.' },
            { icon: Star, title: 'Verified Ratings', desc: 'Both parties rate each other after every booking. Build a reputation that others can trust.' },
            { icon: Package, title: 'Condition Photos', desc: 'Before-and-after photo comparison at handoff and return prevents disputes.' },
            { icon: Users, title: 'Community First', desc: 'Every member is a real workshop owner or tradesperson — no anonymous accounts.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm">
                <item.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <Link to="/signup" className="btn-primary px-8 py-3 text-base">
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
