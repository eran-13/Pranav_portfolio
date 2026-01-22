import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const tools = [
  {
    category: "Photo Editing",
    items: [
      { name: "Lightroom", icon: "Lr" },
      { name: "Photoshop", icon: "Ps" },
      { name: "Canva", icon: "Ca" },
      { name: "Illustrator", icon: "Ai" },
    ],
  },
  {
    category: "Video Editing",
    items: [
      { name: "Premiere Pro", icon: "Pr" },
      { name: "After Effects", icon: "Ae" },
      { name: "Capcut", icon: "Cc" },
    ],
  },
];

const ToolsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tools" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      <div className="container mx-auto max-w-5xl" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-cyan text-sm font-medium tracking-widest uppercase mb-4 block">
            My Arsenal
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Tools I <span className="neon-text">Use</span>
          </h2>
        </motion.div>

        <div className="space-y-16">
          {tools.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: categoryIndex * 0.2 }}
            >
              <h3 className="text-lg font-medium text-muted-foreground mb-6 text-center">
                {category.category}
              </h3>
              
              <div className="flex flex-wrap justify-center gap-6">
                {category.items.map((tool, toolIndex) => (
                  <motion.div
                    key={tool.name}
                    className="group cursor-hover"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ 
                      duration: 0.4, 
                      delay: categoryIndex * 0.2 + toolIndex * 0.1 
                    }}
                  >
                    <motion.div
                      className="relative w-24 h-24 rounded-2xl glass-card flex flex-col items-center justify-center gap-2 overflow-hidden"
                      whileHover={{ 
                        scale: 1.1,
                        y: -5,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Icon */}
                      <span className="text-2xl font-bold font-display neon-text">
                        {tool.icon}
                      </span>
                      
                      {/* Name */}
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {tool.name}
                      </span>

                      {/* Hover Glow */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          boxShadow: "0 0 40px hsl(280 100% 65% / 0.3), inset 0 0 30px hsl(280 100% 65% / 0.1)",
                        }}
                      />

                      {/* Border */}
                      <div className="absolute inset-0 rounded-2xl border border-foreground/10 group-hover:border-neon-purple/40 transition-colors duration-300" />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Neon Divider */}
              {categoryIndex < tools.length - 1 && (
                <div className="section-divider mt-16 max-w-xs mx-auto opacity-50" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
