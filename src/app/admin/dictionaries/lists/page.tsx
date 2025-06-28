'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  fetchAllLists,
  fetchCategories,
  deleteList,
  restoreList,
  type ListWithDetails,
  type ListFilters,
  type CategoryData,
} from '@/core/domains/dictionary/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  List,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Plus,
  Download,
  Users,
  Globe,
  Lock,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LanguageCode, DifficultyLevel } from '@prisma/client';
import { toast } from 'sonner';
import { AdminCreateListDialog } from '@/components/features/admin/dictionary/AdminCreateListDialog';

// Language and difficulty display names
const languageDisplayNames: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  proficient: 'bg-red-100 text-red-800',
};

export default function ListsManagementPage() {
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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadData();

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`/admin/dictionaries/lists?${params.toString()}`);
  };

  // Reset filters
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

  // Selection handlers
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

  // Action handlers
  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;

    try {
      const result = await deleteList(listId);
      if (result.success) {
        toast.success(result.message);
        loadData();
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
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to restore list');
    }
  };

  // Sort handler
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Memoized filtered categories for display
  const categoryMap = useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.id] = category.name;
        return map;
      },
      {} as Record<number, string>,
    );
  }, [categories]);

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" />
                Lists Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all vocabulary lists in the system
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lists..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    category: value === 'all' ? '' : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={filters.difficulty || ''}
                onValueChange={(value) =>
                  setFilters((prev) => {
                    const newFilters = { ...prev };
                    if (value === 'all') {
                      delete newFilters.difficulty;
                    } else {
                      newFilters.difficulty = value as DifficultyLevel;
                    }
                    return newFilters;
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  {Object.entries(difficultyDisplayNames).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={filters.language || ''}
                onValueChange={(value) =>
                  setFilters((prev) => {
                    const newFilters = { ...prev };
                    if (value === 'all') {
                      delete newFilters.language;
                    } else {
                      newFilters.language = value as LanguageCode;
                    }
                    return newFilters;
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {Object.entries(languageDisplayNames).map(([key, name]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={filters.isPublic === true}
                onCheckedChange={(checked) =>
                  setFilters((prev) => {
                    const newFilters = { ...prev };
                    if (checked) {
                      newFilters.isPublic = true;
                    } else {
                      delete newFilters.isPublic;
                    }
                    return newFilters;
                  })
                }
              />
              <Label htmlFor="isPublic">Public lists only</Label>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {lists.length} of {totalCount} lists
          {selectedLists.size > 0 && (
            <span className="ml-2">· {selectedLists.size} selected</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Label className="text-sm">Page size:</Label>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lists Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        lists.length > 0 && selectedLists.size === lists.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-20">Cover</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('difficulty')}
                  >
                    <div className="flex items-center">
                      Difficulty
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('wordCount')}
                  >
                    <div className="flex items-center">
                      Words
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Sample Words</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        <span>Loading lists...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : lists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No lists found</p>
                        <p className="text-sm mb-4">
                          Try adjusting your filters or create a new list
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First List
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  lists.map((list) => (
                    <TableRow
                      key={list.id}
                      className={
                        selectedLists.has(list.id) ? 'bg-muted/50' : ''
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedLists.has(list.id)}
                          onCheckedChange={(checked) =>
                            handleSelectList(list.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {list.coverImageUrl ? (
                          <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={list.coverImageUrl}
                              alt={`${list.name} cover`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <List className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">
                            {list.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {list.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm text-muted-foreground truncate">
                          {list.description || 'No description'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryMap[list.categoryId] || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant="outline">
                            {languageDisplayNames[list.targetLanguageCode]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={difficultyColors[list.difficultyLevel]}
                          variant="secondary"
                        >
                          {difficultyDisplayNames[list.difficultyLevel]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{list.wordCount} total</div>
                          <div className="text-xs text-muted-foreground">
                            {list.learnedWordCount} learned
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {list.userListCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {list.creatorCount} creators
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {list.isPublic ? (
                            <Badge variant="outline" className="text-green-600">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-xs text-muted-foreground">
                          {list.sampleWords.length > 0
                            ? list.sampleWords.slice(0, 3).join(', ') +
                              (list.sampleWords.length > 3 ? '...' : '')
                            : 'No words'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(list.createdAt).toLocaleDateString()}
                          </div>
                          <div className="mt-1">
                            {new Date(list.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/dictionaries/lists/${list.id}`,
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/dictionaries/lists/${list.id}/edit`,
                                )
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {list.deletedAt ? (
                              <DropdownMenuItem
                                onClick={() => handleRestoreList(list.id)}
                                className="text-green-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleDeleteList(list.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalCount} total items)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === currentPage ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create List Dialog */}
      <AdminCreateListDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onListCreated={loadData}
      />
    </div>
  );
}
