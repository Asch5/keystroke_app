import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  fetchAllLists,
  fetchCategories,
  deleteList,
  restoreList,
  type ListWithDetails,
  type ListFilters,
  type CategoryData,
} from '@/core/domains/dictionary/actions';
import { LanguageCode, DifficultyLevel } from '@/core/types';

export function useAdminListsState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [lists, setLists] = useState<ListWithDetails[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter state
  const [filters, setFilters] = useState<ListFilters>(() => {
    const difficulty = searchParams.get('difficulty') as DifficultyLevel;
    const language = searchParams.get('language') as LanguageCode;
    const isPublicParam = searchParams.get('isPublic');
    const sortByParam = searchParams.get('sortBy') as
      | 'name'
      | 'createdAt'
      | 'wordCount'
      | 'category'
      | 'difficultyLevel';

    return {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      ...(difficulty && { difficulty }),
      ...(language && { language }),
      ...(isPublicParam && { isPublic: isPublicParam === 'true' }),
      sortBy: sortByParam || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
  });

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listsResponse, categoriesResponse] = await Promise.all([
        fetchAllLists({
          ...filters,
          page: currentPage,
          pageSize,
        }),
        fetchCategories(),
      ]);

      setLists(listsResponse.lists);
      setTotalCount(listsResponse.totalCount);
      setTotalPages(listsResponse.totalPages);

      if (categoriesResponse.success && categoriesResponse.categories) {
        setCategories(categoriesResponse.categories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
      toast.error('Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Event handlers
  const handleApplyFilters = () => {
    setCurrentPage(1);
    void loadData();

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`/admin/dictionaries/lists?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
    router.push('/admin/dictionaries/lists');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLists(new Set(lists.map((list) => list.id)));
    } else {
      setSelectedLists(new Set());
    }
  };

  const handleSelectList = (listId: string, checked: boolean) => {
    const newSelected = new Set(selectedLists);
    if (checked) {
      newSelected.add(listId);
    } else {
      newSelected.delete(listId);
    }
    setSelectedLists(newSelected);
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const result = await deleteList(listId);
      if (result.success) {
        toast.success(result.message);
        void loadData();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const handleRestoreList = async (listId: string) => {
    try {
      const result = await restoreList(listId);
      if (result.success) {
        toast.success(result.message);
        void loadData();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to restore list');
    }
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    const sortBy = column === 'difficulty' ? 'difficultyLevel' : column;
    setFilters({
      ...filters,
      sortBy: sortBy as
        | 'name'
        | 'createdAt'
        | 'wordCount'
        | 'category'
        | 'difficultyLevel',
      sortOrder: newSortOrder,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    // State
    lists,
    categories,
    isLoading,
    error,
    selectedLists,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    setPageSize,
    setCurrentPage,
    filters,
    setFilters,

    // Actions
    loadData,
    handleApplyFilters,
    handleResetFilters,
    handleSelectAll,
    handleSelectList,
    handleDeleteList,
    handleRestoreList,
    handleSort,
    handlePageChange,
  };
}
