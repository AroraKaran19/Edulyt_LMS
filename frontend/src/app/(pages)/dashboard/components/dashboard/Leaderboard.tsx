import FlexBox from "@/components/ui/FlexBox";
import Image from "next/image";
import React from "react";

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
    <FlexBox className="w-full flex-col h-max gap-6 border border-gray-200 rounded-lg p-5">
      <FlexBox className="w-full justify-between items-center">
        <h2 className="text-base font-bold">Leaderboard</h2>
      </FlexBox>
      <FlexBox className="w-full h-full flex-col gap-4">
        {demoUsers.map(
          (user, index) =>
            index < 10 && (
              <FlexBox
                key={index}
                className={`w-full h-full flex-col p-2.5 gap-2 rounded-xl ${
                  index === 0
                    ? "border-3 border-[#F7AD24]"
                    : "border border-gray-200"
                }`}
              >
                <FlexBox className="w-full h-full gap-4 items-stretch">
                  <FlexBox className="items-center gap-2 shrink-0">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="size-10 bg-[#5E00FF] rounded-xl overflow-hidden flex items-center justify-center">
                        <span className="text-white text-base font-bold select-none">
                          {user.name.split(" ").length === 1
                            ? user.name.substring(0, 2).toUpperCase()
                            : (
                                user.name.split(" ")[0].substring(0, 1) +
                                user.name.split(" ")[1].substring(0, 1)
                              ).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </FlexBox>
                  <FlexBox className="w-full flex-col justify-center">
                    <span className="text-xs font-bold text-text-primary">
                      {user.name}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user.coursesCompleted}{" "}
                      {user.coursesCompleted === 1 ? "course" : "courses"}
                    </span>
                  </FlexBox>
                  {index === 0 && (
                    <Image
                      src="/LeaderboardMedal.svg"
                      alt="medal"
                      width={24}
                      height={24}
                      className="ml-auto shrink-0 select-none"
											quality={100}
											draggable={false}
											loading="lazy"
                    />
                  )}
                </FlexBox>
              </FlexBox>
            )
        )}
      </FlexBox>
    </FlexBox>
  );
};

export default Leaderboard;
