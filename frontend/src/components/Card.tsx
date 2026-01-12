import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  gradient?: boolean;
  hover?: boolean;
}

export default function Card({
  children,
  gradient = false,
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        glass rounded-2xl p-6
        ${gradient ? "gradient-border" : ""}
        ${
          hover
            ? "transition-all duration-300 hover:shadow-xl hover:shadow-raspberry-500/10 hover:-translate-y-1"
            : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
