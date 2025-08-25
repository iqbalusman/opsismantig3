import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Monitoring from './pages/Monitoring';
import Contact from './pages/Contact';
import Footer from './components/Footer';


type Page = 'home' | 'monitoring' | 'contact';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleStartMonitoring = () => {
    setCurrentPage('monitoring');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onStartMonitoring={handleStartMonitoring} />;
      case 'monitoring':
        return <Monitoring />;
      case 'contact':
        return <Contact />;
      default:
        return <Home onStartMonitoring={handleStartMonitoring} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <AnimatePresence mode="wait">
        <motion.main
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderPage()}
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default App;
