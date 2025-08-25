import React from "react";
import { motion } from "framer-motion";
import { GiFishSmoking } from "react-icons/gi";

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-10 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white shadow-inner"
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/20 shadow">
            <GiFishSmoking className="h-6 w-6 text-yellow-300" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold tracking-tight drop-shadow">
            Monitor Ikan Cakalang Fufu
          </h2>
          <p className="text-xs text-white/75 max-w-prose">
            Pantau kualitas ikan Fufu secara real-time dengan sensor yang mudah dipahami.
          </p>
        </div>

        {/* Links */}
        <div className="mt-4 border-t border-white/20 pt-4">
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-4 text-xs font-medium text-white/85">
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Monitoring
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Dokumentasi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                  Kontak
                </a>
              </li>
            </ul>
          </nav>

          {/* Bottom line */}
          <p className="mt-4 text-center text-[11px] text-white/65">
            © {new Date().getFullYear()} Fufu Monitor • Semua hak dilindungi.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
