'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { ChannelCard } from '@/components/ChannelCard';
import { AddChannelForm } from '@/components/AddChannelForm';
import { getChannelsPaginated } from '@/lib/actions/channels';
import { ChannelWithDetails } from '@/types';

export default function Home() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<ChannelWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChannels, setTotalChannels] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const ITEMS_PER_PAGE = 12;

  const fetchChannels = async (page: number = 1, search: string = '') => {
    try {
      setIsLoading(true);
      const result = await getChannelsPaginated(page, ITEMS_PER_PAGE, search);
      setChannels(result.channels);
      setTotalPages(result.totalPages);
      setTotalChannels(result.total);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(initialPage);
    fetchChannels(initialPage, searchTerm);
  }, []);

  // Handle browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      const newPage = pageParam ? parseInt(pageParam) : 1;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
        fetchChannels(newPage, searchTerm);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchChannels(newPage, searchTerm);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update URL with page parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', newPage.toString());
      window.history.pushState({}, '', `?${params.toString()}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    fetchChannels(1, searchTerm);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setIsSearching(true);
    fetchChannels(1, '');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            YouTube Channels
          </h1>
          <p className="text-gray-600">
            Discover and share amazing startup YouTube channels with the community to help those channels grow.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {session && (
          <AddChannelForm userId={session.user?.id || ''} onChannelAdded={() => fetchChannels(1, searchTerm)} />
        )}

        {/* Results Info */}
        {!isLoading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalChannels)} of{' '}
            {totalChannels} channels
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : channels.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {channels.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No channels found' : 'No channels yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try a different search term'
                : session
                ? 'Be the first to add a channel!'
                : 'Sign in to add channels and discover amazing content.'}
            </p>
            {searchTerm && (
              <button
                onClick={handleSearchClear}
                className="mt-4 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}