import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Github, Linkedin, Twitter } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    alert('Terima kasih! Pesan Anda telah dikirim.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      info: 'info@fufumonitor.com',
      color: 'text-blue-600'
    },
    {
      icon: Phone,
      title: 'Telepon',
      info: '+62 812-3456-7890',
      color: 'text-green-600'
    },
    {
      icon: MapPin,
      title: 'Lokasi',
      info: 'Jakarta, Indonesia',
      color: 'text-red-600'
    }
  ];

  const socialLinks = [
    { icon: Github, url: '#', color: 'hover:text-gray-800' },
    { icon: Linkedin, url: '#', color: 'hover:text-blue-700' },
    { icon: Twitter, url: '#', color: 'hover:text-blue-500' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-8 pb-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Hubungi Kami
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Ada pertanyaan tentang sistem monitoring ikan Fufu? Tim kami siap membantu Anda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Kirim Pesan</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80"
                  placeholder="nama@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 resize-none"
                  placeholder="Tulis pesan Anda di sini..."
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Kirim Pesan</span>
              </motion.button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Informasi Kontak</h2>
              <div className="space-y-6">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ x: 10 }}
                      className="flex items-center space-x-4"
                    >
                      <div className={`p-3 rounded-lg ${item.color} bg-gray-50`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600">{item.info}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Tim Developer</h2>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">TM</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Tim Monitoring Fufu</h3>
                <p className="text-gray-600 mb-6">
                  Spesialis dalam teknologi monitoring aquaculture dan sistem sensor IoT
                </p>

                <div className="flex justify-center space-x-4">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={index}
                        href={social.url}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        className={`p-3 bg-gray-100 rounded-lg text-gray-600 ${social.color} transition-colors duration-300`}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Contact;