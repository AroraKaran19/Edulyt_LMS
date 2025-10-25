import Image from "next/image";

const Leaderboard = () => {
  const demoUsers = [
    {
      id: 1,
      name: "John Doe",
      avatar: null,
      coursesCompleted: 10,
    },
    {
      id: 2,
      name: "Jane Doe",
      avatar: null,
      coursesCompleted: 8,
    },
    {
      id: 3,
      name: "John Doe",
      avatar: null,
      coursesCompleted: 12,
    },
  ];

  return (
    <div className="flex w-full flex-col h-max gap-4 sm:gap-5 md:gap-6 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5">
      <div className="flex w-full justify-between items-center">
        <h2 className="text-sm sm:text-base font-bold">Leaderboard</h2>
      </div>
      <div className="flex w-full h-full flex-col gap-2 sm:gap-3 md:gap-4">
        {demoUsers.map(
          (user, index) =>
            index < 10 && (
              <div
                key={index}
                className={`flex w-full h-full flex-col p-2 sm:p-2.5 gap-1.5 sm:gap-2 rounded-xl ${
                  index === 0
                    ? "border-3 border-[#F7AD24]"
                    : "border border-gray-200"
                }`}
              >
                <div className="flex w-full gap-2 sm:gap-3 md:gap-4 items-center">
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full sm:w-10 sm:h-10"
                      />
                    ) : (
                      <div className="size-8 sm:size-10 bg-[#5E00FF] rounded-xl overflow-hidden flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-bold select-none">
                          {user.name.split(" ").length === 1
                            ? user.name.substring(0, 2).toUpperCase()
                            : (
                                user.name.split(" ")[0].substring(0, 1) +
                                user.name.split(" ")[1].substring(0, 1)
                              ).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex w-full flex-col justify-center">
                    <span className="text-xs font-bold text-text-primary">
                      {user.name}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user.coursesCompleted}{" "}
                      {user.coursesCompleted === 1 ? "course" : "courses"}
                    </span>
                  </div>
                  {index === 0 && (
                    <Image
                      src="/dashboard/LeaderboardMedal.svg"
                      alt="medal"
                      width={20}
                      height={20}
                      className="ml-auto shrink-0 select-none sm:w-6 sm:h-6"
                      quality={100}
                      draggable={false}
                      loading="lazy"
                    />
                  )}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
