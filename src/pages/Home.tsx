import React from 'react';
import { motion } from 'framer-motion';
import {
  Waves, Thermometer, Wind, ArrowRight,
  Cpu, CircuitBoard, Wifi, Cloud, Shield, Activity,
  Gauge, Clock, Database, Zap, Radio, Camera, BarChart3
} from 'lucide-react';
import { GiFishSmoking } from 'react-icons/gi';

type HomeProps = {
  onStartMonitoring: () => void;
};

const Home: React.FC<HomeProps> = ({ onStartMonitoring }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delayChildren: 0.3, staggerChildren: 0.2 } }
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

  const iotStack = [
    {
      icon: Cpu,
      title: 'Edge Node',
      desc: 'Mikrokontroler (ESP32) dengan sensor mics3200, dallas, sensor color .'
    },
    {
      icon: Radio,
      title: 'Protokol',
      desc: 'Kirim data via Wi-Fi menggunakan HTTP/MQTT sesuai kebutuhan instalasi.'
    },
    {
      icon: Cloud,
      title: 'Gateway & Cloud',
      desc: 'GAS Web App + Google Sheets sebagai endpoint sederhana, murah, dan andal.'
    },
    {
      icon: Database,
      title: 'Pipeline Data',
      desc: 'Normalisasi kolom (timestamp, suhu, warna, status gas, nilai gas, avg rgb).'
    },
    {
      icon: Shield,
      title: 'Keamanan',
      desc: 'Dukungan token sederhana di endpoint + CORS & cache-buster untuk integritas data.'
    }
  ];

  const advantages = [
    { icon: Activity, title: 'Realtime & Ringan', desc: 'Hook polling (VITE_SHEET_POLL_MS) menyegarkan data tanpa beban berat.' },
    { icon: Camera, title: 'Avg RGB', desc: 'Grafik nilai avg_rgb untuk mewakili kecerahan/warna ikan.' },
    { icon: Gauge, title: 'Status dari Sheet', desc: 'Penentuan “Segar/Tidak” berbasis label warna_ikan & status_gas dari spreadsheet.' },
    { icon: Clock, title: 'Time-zone Lokal', desc: 'Timestamp diformat sesuai zona waktu (Asia/Gorontalo).' },
    { icon: Database, title: 'Ekspor CSV', desc: 'Sekali klik unduh seluruh data dalam format CSV.' },
    { icon: Zap, title: 'Responsif & Mulus', desc: 'UI mobile-first dengan animasi halus, skeleton saat loading.' },
    { icon: CircuitBoard, title: 'Mudah Integrasi', desc: 'Skema kolom sederhana, cocok untuk berbagai sensor & firmware.' },
    { icon: Wifi, title: 'Stabil di Lapangan', desc: 'Cache-buster & no-store mencegah data basi pada jaringan fluktuatif.' },
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
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-blue-200 shadow-lg">
              <span className="text-blue-600 font-semibold">🐟 Kesegaran Terjamin</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, rotate: -5 }} className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-cyan-200 shadow-lg">
              <span className="text-cyan-600 font-semibold">📊 Monitoring Fisik</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-orange-200 shadow-lg">
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

       {/* NEW: Teknologi IoT Terdepan (teks kiri, foto kanan) */}
<motion.section variants={itemVariants} className="mb-16">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
    {/* Kolom Teks */}
    <div>
      <h2 className="text-3xl font-bold text-gray-9000 mb-3">Teknologi IoT Terdepan</h2>
      <p className="text-gray-600 mb-6">
        Arsitektur ringan dan andal dari edge hingga dashboard untuk memastikan data sensor
        stabil, real-time, dan mudah diintegrasikan.
      </p>

      <ul className="space-y-5">
        {iotStack.map((s, i) => {
          const Icon = s.icon as any;
          return (
            <li key={i} className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>

    {/* Kolom Foto */}
    <div className="relative">
      {/* dekorasi blur halus di belakang gambar */}
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-100 to-cyan-100 blur-2xl opacity-70" />
    </div>
  </div>
</motion.section>


        {/* NEW: Fitur Keunggulan */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Fitur Keunggulan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((a, i) => {
              const Icon = a.icon as any;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -6 }}
                  className="p-5 rounded-2xl border bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">{a.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="text-center bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-white shadow-2xl">
          <Waves className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Siap Memulai Monitoring?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Pantau kondisi fisik ikan Fufu Anda secara real-time dan dapatkan analisis mendalam
            tentang kesegaran dan kualitas ikan.
          </p>
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
