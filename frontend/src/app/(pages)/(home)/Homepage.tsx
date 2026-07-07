import HomeHeroSection from "./components/sections/HomeHeroSection";
import HomeSectionsFold from "./components/HomeSectionsFold";
import WhatsAppButton from "./components/WhatsAppButton";

const Homepage = () => {
  return (
    <div className="w-full">
      <HomeHeroSection />
      <HomeSectionsFold />
      <WhatsAppButton />
    </div>
  );
};

export default Homepage;
