'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/Navbar';
import { getBookmarks, createBookmark, toggleBookmarkLike, deleteBookmark, updateBookmark } from '@/lib/actions/bookmarks';
import { BookmarkFormData } from '@/lib/actions/bookmarks';

interface BookmarkWithLikes {
  id: string;
  url: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  isLiked: boolean;
}

export default function BookmarksPage() {
  const { session } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithLikes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAllPublic, setShowAllPublic] = useState(true);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkWithLikes | null>(null);
  const [formData, setFormData] = useState<BookmarkFormData>({
    url: '',
    title: '',
    description: '',
    status: 'private'
  });

  const fetchBookmarks = async (page = 1, limit = 10) => {
    try {
      setIsLoading(true);
      const data = await getBookmarks(session?.user?.id || null, page, limit, showAllPublic);
      setBookmarks(data.bookmarks);
      setTotalPages(data.totalPages);
      setTotalBookmarks(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      if (editingBookmark) {
        // Update existing bookmark
        const result = await updateBookmark(editingBookmark.id, session.user.id, formData);
        if (result.success) {
          setFormData({ url: '', title: '', description: '', status: 'private' });
          setEditingBookmark(null);
          fetchBookmarks(currentPage);
        } else {
          alert(result.error);
        }
      } else {
        // Create new bookmark
        const result = await createBookmark(formData, session.user.id);
        if (result.success) {
          setFormData({ url: '', title: '', description: '', status: 'private' });
          setShowAddForm(false);
          fetchBookmarks(currentPage);
        } else {
          alert(result.error);
        }
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
      alert('Failed to save bookmark');
    }
  };

  const handleLikeToggle = async (bookmarkId: string) => {
    if (!session?.user?.id) return;

    try {
      await toggleBookmarkLike(bookmarkId, session.user.id);
      fetchBookmarks(currentPage);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async (bookmarkId: string) => {
    if (!session?.user?.id) return;

    try {
      const result = await deleteBookmark(bookmarkId, session.user.id);
      if (result.success) {
        fetchBookmarks(currentPage);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
    }
  };

  const handleEdit = (bookmark: BookmarkWithLikes) => {
    setEditingBookmark(bookmark);
    setFormData({
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description || '',
      status: bookmark.status as 'private' | 'public'
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingBookmark(null);
    setFormData({ url: '', title: '', description: '', status: 'private' });
  };

  const fetchUrlMetadata = async (url: string) => {
    try {
      // Basic validation
      if (!url || !url.startsWith('http')) return;
      
      // Call API to fetch metadata
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description
        }));
      }
    } catch (error) {
      console.error('Error fetching URL metadata:', error);
    }
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, url }));
    
    // Debounce the metadata fetch
    if (url && url.startsWith('http')) {
      setTimeout(() => fetchUrlMetadata(url), 1000);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [session?.user?.id, showAllPublic]);

  // Guest users can view public bookmarks but not manage them
  const isGuest = !session;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
            <p className="text-gray-600 mt-2">
              {isGuest ? 'Discover public bookmarks' : 'Save and organize your favorite links'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {!isGuest && (
              <button
                onClick={() => {
                  setShowAllPublic(!showAllPublic);
                  fetchBookmarks(1);
                }}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  showAllPublic
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {showAllPublic ? 'Viewing Public' : 'View Public Bookmarks'}
              </button>
            )}
            {!isGuest && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {showAddForm ? 'Cancel' : 'Add Bookmark'}
              </button>
            )}
          </div>
        </div>

        {(showAddForm || editingBookmark) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  id="url"
                  required
                  value={formData.url}
                  onChange={handleUrlChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Website Title"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description..."
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'private' | 'public' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private (only you can see)</option>
                  <option value="public">Public (everyone can see)</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingBookmark ? 'Update Bookmark' : 'Add Bookmark'}
                </button>
                {editingBookmark && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <>
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {bookmark.title}
                        </a>
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bookmark.status === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bookmark.status === 'public' ? 'Public' : 'Private'}
                      </span>
                    </div>
                    {session?.user?.id === bookmark.userId && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(bookmark)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bookmark.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{bookmark.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                    >
                      {bookmark.url}
                    </a>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLikeToggle(bookmark.id)}
                        className={`p-2 rounded-full transition-colors ${
                          bookmark.isLiked
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 17.414 17.414 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a17.414 17.414 0 01-2.582 1.9 20.759 20.759 0 01-1.162.682l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600">{bookmark.likeCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => fetchBookmarks(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchBookmarks(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchBookmarks(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {totalBookmarks > 0 && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalBookmarks)} of {totalBookmarks} bookmarks
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
            <p className="text-gray-500">
              {isGuest ? 'No public bookmarks available yet.' : 
               showAddForm ? 'Fill out the form above to add your first bookmark!' : 'Click "Add Bookmark" to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}