import React from 'react';
import { motion } from 'framer-motion';
import { Waves, Thermometer, Wind, ArrowRight } from 'lucide-react';
import { GiFishSmoking } from 'react-icons/gi';

type HomeProps = {
  onStartMonitoring: () => void;
};

const Home: React.FC<HomeProps> = ({ onStartMonitoring }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.3, staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const features = [
    {
      icon: Thermometer,
      title: 'Monitor Suhu Ikan',
      description:
        'Pemantauan suhu tubuh ikan Fufu secara real-time untuk memastikan kondisi kesehatan optimal'
    },
    {
      icon: GiFishSmoking,
      title: 'Analisis Warna Ikan',
      description:
        'Deteksi kecerahan dan kualitas warna ikan untuk menilai kesegaran dan kesehatan'
    },
    {
      icon: Wind,
      title: 'Sensor Gas Ikan',
      description:
        'Pengukuran kadar gas pada ikan untuk mendeteksi tingkat kesegaran'
    }
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.div variants={itemVariants} className="relative mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-2xl mb-6"
            >
              <GiFishSmoking className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-bold mb-6 text-center">
              {/* Kunci jarak: block + mb-3 + text-transparent agar gradient tampil */}
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-blue-500 mb-5">
                Sistem Monitoring
              </span>
              <span className="block text-orange-500">Ikan Cakalang Fufu</span>
            </motion.h1>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Platform monitoring canggih untuk memantau kondisi fisik ikan cakalang Fufu secara real-time
            dengan teknologi sensor yang menganalisis suhu, warna, dan gas pada ikan.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-12">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-200 shadow-lg"
            >
              <span className="text-blue-600 font-semibold">🐟 Kesegaran Terjamin</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-cyan-200 shadow-lg"
            >
              <span className="text-cyan-600 font-semibold">📊 Monitoring Fisik</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-orange-200 shadow-lg"
            >
              <span className="text-orange-600 font-semibold">⚡ Analisis Otomatis</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon as any;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="text-center bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-white shadow-2xl">
          <Waves className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Siap Memulai Monitoring?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Pantau kondisi fisik ikan Fufu Anda secara real-time dan dapatkan analisis mendalam
            tentang kesegaran dan kualitas ikan.
          </p>

          {/* Klik tombol ini untuk pindah ke halaman Monitoring */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartMonitoring}
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Mulai Monitoring
            <ArrowRight className="w-5 h-5 ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
