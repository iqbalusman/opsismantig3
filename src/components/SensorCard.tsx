import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Fish, Wind, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string;
  status: {
    status: "good" | "warning" | "danger";
    message: string;
  };
  icon: "temperature" | "fish" | "gas";
  subtitle?: string;
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, status, icon, subtitle }) => {
  const Icon = icon === "temperature" ? Thermometer : icon === "fish" ? Fish : Wind;
  const StatusIcon = status.status === "good" ? CheckCircle : status.status === "warning" ? AlertTriangle : XCircle;

  const badge =
    status.status === "good"
      ? "text-green-600 bg-green-50 border-green-200"
      : status.status === "warning"
      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
      : "text-red-600 bg-red-50 border-red-200";

  const border =
    status.status === "good"
      ? "border-l-4 border-l-green-500"
      : status.status === "warning"
      ? "border-l-4 border-l-yellow-500"
      : "border-l-4 border-l-red-500";

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 ${border} hover:shadow-2xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-3xl font-bold text-gray-800 mb-2">
          {value}
        </motion.div>
      </div>

      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${badge}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="text-sm font-semibold">{status.message}</span>
      </div>
    </motion.div>
  );
};

export default SensorCard;
