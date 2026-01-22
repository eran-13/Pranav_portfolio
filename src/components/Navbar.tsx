import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Stories", href: "#stories" },
  { label: "Pinterest", href: "#pinterest" },
  { label: "Posts", href: "#posts" },
  { label: "Editing", href: "#editing" },
  { label: "Reels", href: "#reels" },
  { label: "Tools", href: "#tools" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [activeSection, setActiveSection] = useState("about");
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.href.slice(1));
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-magenta z-[100]"
        style={{ width: progressWidth }}
      />

      {/* Navbar */}
      <motion.nav
        className="fixed top-1 left-1/2 -translate-x-1/2 z-50 px-2 py-2 mt-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="glass-card rounded-full px-6 py-3 flex items-center gap-1 md:gap-4">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollToSection(item.href)}
              className="relative px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors duration-300"
            >
              <span
                className={`relative z-10 ${
                  activeSection === item.href.slice(1)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </span>
              {activeSection === item.href.slice(1) && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute inset-0 bg-neon-purple/20 rounded-full"
                  style={{
                    boxShadow: "0 0 20px hsl(280 100% 65% / 0.3)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
