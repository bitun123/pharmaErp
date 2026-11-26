"use client";

import { ArrowUpDown, ListFilter, X } from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SEARCH_MAX_LENGTH,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type ShopListParams,
  type ShopSort,
  type ShopStatusFilter,
} from "../store/shop-list-params";

type Props = {
  params: ShopListParams;
  hasFilters: boolean;
  onSearch: (value: string) => void;
  onStatus: (value: ShopStatusFilter) => void;
  onSort: (value: ShopSort) => void;
  onReset: () => void;
};

// No border: a soft shadow separates the fields from the card instead.
const FIELD =
  "border-transparent bg-card shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)]";

const statusItems = STATUS_OPTIONS.map(({ value, label }) => ({ value, label }));
const sortItems = SORT_OPTIONS.map(({ value, label }) => ({ value, label }));

/** Search, status filter and sort. All three are applied by the server. */
export function ShopFilters({ params, hasFilters, onSearch, onStatus, onSort, onReset }: Props) {
  return (
    <div className="flex flex-col gap-2 px-4 pb-4 sm:px-6 lg:flex-row lg:items-center">
      <SearchInput
        value={params.search}
        onSearch={onSearch}
        placeholder="Search by name, shop code or slug"
        maxLength={SEARCH_MAX_LENGTH}
        className="lg:max-w-md lg:flex-1"
        inputClassName={FIELD}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={params.status}
          items={statusItems}
          onValueChange={(value) => value && onStatus(value as ShopStatusFilter)}
        >
          <SelectTrigger aria-label="Filter by status" className={`h-10 w-full sm:w-44 ${FIELD}`}>
            <ListFilter className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.sort}
          items={sortItems}
          onValueChange={(value) => value && onSort(value as ShopSort)}
        >
          <SelectTrigger aria-label="Sort shops" className={`h-10 w-full sm:w-48 ${FIELD}`}>
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button type="button" variant="ghost" onClick={onReset} className="h-10 gap-1.5 px-3 text-muted-foreground">
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
