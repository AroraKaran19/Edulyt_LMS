import React from 'react';
import ProfileCard from './ProfileCard';
import AnonymousToggle from './AnonymousToggle';

const ProfileSidebar = () => {
    return (
        <div className="flex flex-col gap-6">
            <ProfileCard />
            <AnonymousToggle />
        </div>
    );
};

export default ProfileSidebar;
