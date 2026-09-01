import { Link } from 'react-router-dom';
import { Wrench, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
                ToolShare
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              A community platform for workshops and electricians to share idle
              equipment locally. Save costs, build trust, keep tools moving.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-brand-600">Browse Equipment</Link></li>
              <li><Link to="/how-it-works" className="hover:text-brand-600">How it Works</Link></li>
              <li><Link to="/signup" className="hover:text-brand-600">List Your Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Connect
            </h4>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-600 transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-600 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-600 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
          <p>ToolShare — Built for the maker community.</p>
        </div>
      </div>
    </footer>
  );
}
