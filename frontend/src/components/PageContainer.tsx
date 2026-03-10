import React from 'react';
import Navbar from './Navbar';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className={`container mx-auto px-4 py-8 ${className}`}>
        {children}
      </main>
    </div>
  );
};

export default PageContainer;
