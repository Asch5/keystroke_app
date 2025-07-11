'use client';

import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Users,
  Globe,
  Lock,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  List,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { AdminCreateListDialog } from '@/components/features/admin/dictionary/AdminCreateListDialog';
import {
  AdminListsHeader,
  useAdminListsState,
} from '@/components/features/admin/dictionary/lists';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { LanguageCode, DifficultyLevel } from '@/core/types';

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
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
};

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-difficulty-beginner-subtle text-difficulty-beginner-foreground',
  elementary:
    'bg-difficulty-elementary-subtle text-difficulty-elementary-foreground',
  intermediate:
    'bg-difficulty-intermediate-subtle text-difficulty-intermediate-foreground',
  advanced: 'bg-difficulty-advanced-subtle text-difficulty-advanced-foreground',
  proficient:
    'bg-difficulty-proficient-subtle text-difficulty-proficient-foreground',
};

export default function ListsManagementPage() {
  // Use custom hook for state management
  const {
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
    loadData,
    handleApplyFilters,
    handleResetFilters,
    handleSelectAll,
    handleSelectList,
    handleDeleteList,
    handleRestoreList,
    handleSort,
    handlePageChange,
  } = useAdminListsState();

  // Router for navigation
  const router = useRouter();

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
      <AdminListsHeader onCreateList={() => setIsCreateDialogOpen(true)} />

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
                <Search className="absolute left-3 top-3 h-4 w-4 text-content-tertiary" />
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
                          <div className="w-12 h-12 relative bg-content-soft rounded overflow-hidden">
                            <Image
                              src={list.coverImageUrl}
                              alt={`${list.name} cover`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-content-soft rounded flex items-center justify-center">
                            <List className="h-6 w-6 text-content-tertiary" />
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
                            <Badge
                              variant="outline"
                              className="text-success-foreground"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-content-secondary"
                            >
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
                                className="text-success-foreground"
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
