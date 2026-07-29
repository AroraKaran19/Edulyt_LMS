import { getHomePageSettings } from "@/lib/home-page/getHomePageSettings";
import HomeHeroSection from "./components/sections/HomeHeroSection";
import HomeSectionsFold from "./components/HomeSectionsFold";
import WhatsAppButton from "./components/WhatsAppButton";

/**
 * The CMS settings are fetched here, on the server, so the page ships fully
 * rendered instead of flashing a loader while the browser fetches them. The
 * fetch is cached under `home-page-settings` and busted by the backend on edit.
 */
const Homepage = async () => {
  const settings = await getHomePageSettings();

  return (
    <div className="w-full">
      <HomeHeroSection settings={settings.hero} />
      <HomeSectionsFold settings={settings} />
      <WhatsAppButton />
    </div>
  );
};

export default Homepage;
