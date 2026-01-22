import Navbar from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import AboutSection from "@/components/sections/AboutSection";
import InstagramStoriesSection from "@/components/sections/InstagramStoriesSection";
import PinterestSection from "@/components/sections/PinterestSection";
import InstagramPostsSection from "@/components/sections/InstagramPostsSection";
import EditingWorkSection from "@/components/sections/EditingWorkSection";
import ReelsSection from "@/components/sections/ReelsSection";
import FoodMenuSection from "@/components/sections/FoodMenuSection";
import WeddingInvitationSection from "@/components/sections/WeddingInvitationSection";
import ToolsSection from "@/components/sections/ToolsSection";
import ContactSection from "@/components/sections/ContactSection";
const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Particles Background */}
      <ParticlesBackground />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main Content */}
      <main className="relative z-10">
        <AboutSection />
        <InstagramStoriesSection />
        <PinterestSection />
        <InstagramPostsSection />
        <EditingWorkSection />
        <ReelsSection />
        <FoodMenuSection />
        <WeddingInvitationSection />
        <ToolsSection />
        <ContactSection />
      </main>
    </div>
  );
};

export default Index;
