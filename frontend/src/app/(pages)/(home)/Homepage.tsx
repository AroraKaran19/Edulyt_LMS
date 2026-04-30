import HomeHeroSection from "./components/sections/HomeHeroSection";
import HomeSectionsFold from "./components/HomeSectionsFold";

const Homepage = () => {
  return (
    <div className="w-full">
      <HomeHeroSection />
      <HomeSectionsFold />
    </div>
  );
};

export default Homepage;
