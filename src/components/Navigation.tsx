import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Settings } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  return (
    <header className="bg-primary shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold text-black flex items-center gap-2">
            <Camera className="w-8 h-8" />
            Picasso's Portraits
          </Link>
          <Link
            to={isAdmin ? '/' : '/admin'}
            className="flex items-center gap-2 px-4 py-2 bg-accent-teal text-white rounded-full hover:bg-accent-teal/90 transition-colors shadow-button-3d"
          >
            {isAdmin ? (
              <>
                <Camera className="w-5 h-5" />
                <span>Photo Booth</span>
              </>
            ) : (
              <>
                <Settings className="w-5 h-5" />
                <span>Admin Panel</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navigation;