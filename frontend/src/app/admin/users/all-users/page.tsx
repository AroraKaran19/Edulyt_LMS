"use client";
import AdminTopHeader from '@/components/admin/AdminTopHeader'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useUsers } from '@/hooks/useUsers'
import Searchbar2 from '@/components/ui/Searchbar2'
import Loader from '@/components/ui/Loader'
import OrangeButton from '@/components/ui/buttons/OrangeButton'
import WhiteButton from '@/components/ui/buttons/WhiteButton'
import { Search, Users, Filter, MoreVertical, Eye, Edit, Trash2, Mail, Calendar, Shield, ShoppingBag, UserCheck, UserX, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'student' | 'instructor' | 'collaborator';
  status: string;
  profilePicture?: string;
  provider: 'credentials' | 'google' | 'linkedin';
  permissions: string[];
  orders: any[];
  createdAt: string;
}

// User Avatar Component
const UserAvatar = ({ user }: { user: User }) => {
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden shadow-sm">
      {user.profilePicture ? (
        <Image 
          src={user.profilePicture} 
          alt={`${user.firstName} ${user.lastName}`}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-orange-600 font-bold text-xl">
          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
        </span>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ type, value }: { type: 'userType' | 'status'; value: string }) => {
  const getColorClasses = () => {
    if (type === 'userType') {
      switch (value) {
        case 'instructor': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'student': return 'bg-green-50 text-green-700 border-green-200';
        case 'collaborator': return 'bg-purple-50 text-purple-700 border-purple-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    } else {
      switch (value.toLowerCase()) {
        case 'active': return 'bg-green-50 text-green-700 border-green-200';
        case 'inactive': return 'bg-red-50 text-red-700 border-red-200';
        case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    }
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium border",
      getColorClasses()
    )}>
      {type === 'userType' 
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : value
      }
    </span>
  );
};

// User Stats Component
const UserStats = ({ user }: { user: User }) => {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <ShoppingBag className="w-3 h-3" />
        <span>{user.orders?.length || 0} orders</span>
      </div>
      <div className="flex items-center gap-1">
        <Shield className="w-3 h-3" />
        <span>{user.permissions?.length || 0} permissions</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// User Actions Dropdown Component
const UserActions = ({ user }: { user: User }) => {
  const [showActions, setShowActions] = useState(false);

  const handleAction = (action: string) => {
    console.log(`${action} user:`, user._id);
    setShowActions(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="p-2 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
      </button>

      {showActions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowActions(false)}
          />
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20 min-w-[160px]">
            <button 
              onClick={() => handleAction('view')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button 
              onClick={() => handleAction('edit')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Edit className="w-4 h-4" />
              Edit User
            </button>
            <button 
              onClick={() => handleAction('email')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <hr className="my-2" />
            <button 
              onClick={() => handleAction('delete')}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Provider Icon Component
const ProviderIcon = ({ provider }: { provider: string }) => {
  if (provider === 'credentials') {
    return null;
  }

  const iconProps = {
    width: 20,
    height: 20,
    className: "w-5 h-5"
  };

  switch (provider) {
    case 'google':
      return (
        <Image 
          src="/google-icon.svg" 
          alt="Google" 
          {...iconProps}
        />
      );
    case 'linkedin':
      return (
        <Image 
          src="/linkedin-icon.svg" 
          alt="LinkedIn" 
          {...iconProps}
        />
      );
    default:
      return null;
  }
};

// User Card Component
const UserCard = ({ user }: { user: User }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <UserAvatar user={user} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {user.firstName} {user.lastName}
              </h3>
              <ProviderIcon provider={user.provider} />
            </div>
            
            <p className="text-gray-600 text-sm mb-3 truncate">{user.email}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge type="userType" value={user.userType} />
              <StatusBadge type="status" value={user.status} />
            </div>

            <UserStats user={user} />
          </div>
        </div>

        <UserActions user={user} />
      </div>
    </div>
  );
};

// Page Header Component
const PageHeader = ({ totalUsers }: { totalUsers: number }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-sm">
          <Users className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600 mt-1">Manage and view all registered users</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
          <span className="text-orange-700 font-semibold text-sm">
            {totalUsers} total users
          </span>
        </div>
      </div>
    </div>
  );
};

// Search and Filter Component
const SearchAndFilter = ({ 
  searchTerm, 
  setSearchTerm, 
  userTypeFilter, 
  setUserTypeFilter, 
  onSearch 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  userTypeFilter: string;
  setUserTypeFilter: (type: string) => void;
  onSearch: () => void;
}) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex-1 max-w-md">
        <Searchbar2
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={onSearch}
        />
      </div>
      
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={userTypeFilter}
          onChange={(e) => setUserTypeFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm"
        >
          <option value="all">All Types</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="collaborator">Collaborators</option>
        </select>
      </div>
    </div>
  );
};

// Loading State Component
const LoadingState = () => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <Loader size="lg" variant="spinner" showText={true} text="Loading users..." />
      </div>
    </div>
  );
};

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserX className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <OrangeButton onClick={onRetry}>
          Try Again
        </OrangeButton>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({ searchTerm }: { searchTerm: string }) => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
        <p className="text-gray-600">
          {searchTerm ? 'Try adjusting your search terms' : 'No users have been registered yet'}
        </p>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <WhiteButton
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm"
      >
        Previous
      </WhiteButton>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                currentPage === page
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <WhiteButton
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm"
      >
        Next
      </WhiteButton>
    </div>
  );
};

// Main Page Component
const page = () => {
  const { fetchUsers, isLoading, error } = useUsers();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');

  const loadUsers = async (page: number = 1, search: string = '') => {
    const response = await fetchUsers(page, 12, search);
    if (response?.success) {
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setTotalUsers(response.data.total);
    }
  };

  useEffect(() => {
    loadUsers(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1, searchTerm);
  };

  const handleUserTypeFilter = (type: string) => {
    setUserTypeFilter(type);
    // In a real implementation, you'd filter the users here
    // For now, we'll just update the state
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    loadUsers(currentPage, searchTerm);
  };

  const filteredUsers = userTypeFilter === 'all' 
    ? users 
    : users.filter(user => user.userType === userTypeFilter);

    return (
    <div className="w-full h-full flex flex-col bg-gray-50" suppressHydrationWarning>
            <AdminTopHeader />
      
      <div className="flex-1 p-8">
        <PageHeader totalUsers={totalUsers} />
        
        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          userTypeFilter={userTypeFilter}
          setUserTypeFilter={handleUserTypeFilter}
          onSearch={handleSearch}
        />

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          <>
            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default page;
