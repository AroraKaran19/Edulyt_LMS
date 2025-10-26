import UserMenu from "../shared/User/UserMenu";
import ImageComponent from "../ui/ImageComponent";

const AdminTopHeader = () => {
  return (
    <div className="flex items-center justify-between w-full bg-white py-4 px-6">
      {/* Search Bar */}
      {/* <div className="relative">
        <input
          type="text"
          placeholder="Search"
          className="w-80 h-10 text-[#667085] font-medium font-coolvetica rounded-md border border-[#F2F4F7] text-sm pl-4 pr-10 placeholder:text-[#667085]"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <ImageComponent
            src="/admin/search-icon.svg"
            alt="search"
            width={20}
            height={20}
          />
        </div>
      </div> */}

      {/* User Profile Section */}
      <div className="ml-auto flex items-center gap-8">
        {/* Notifications */}
        {/* <div className="relative">
          <div className="w-10 h-10 bg-white border border-[#F2F4F7] rounded-xl flex items-center justify-center cursor-pointer">
            <ImageComponent
              src="/admin/notification-icon.svg"
              alt="notification"
              width={20}
              height={20}
            />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-medium">1</span>
          </div>
        </div> */}

        {/* Vertical Separator */}
        {/* <div className="w-px h-6 bg-[#EAECF0]"></div> */}

        {/* User Profile */}
        <UserMenu />
      </div>
    </div>
  );
};

export default AdminTopHeader;
