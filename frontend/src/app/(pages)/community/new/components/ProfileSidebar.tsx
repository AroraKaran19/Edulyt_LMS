"use client";

import React from "react";
import ProfileCard from "./ProfileCard";
import AnonymousToggle from "./AnonymousToggle";

interface ProfileSidebarProps {
    anonymous: boolean;
    onAnonymousChange: (next: boolean) => void;
}

const ProfileSidebar = ({
    anonymous,
    onAnonymousChange,
}: ProfileSidebarProps) => {
    return (
        <div className="flex flex-col gap-6">
            <ProfileCard />
            <AnonymousToggle
                anonymous={anonymous}
                onChange={onAnonymousChange}
            />
        </div>
    );
};

export default ProfileSidebar;
