import { Brand, Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export type Filters = {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
};

type ProductFiltersProps = {
  onFiltersChange: (filters: Filters) => void;
  className?: string;
};

export default function ProductFilters({
  onFiltersChange,
  className = "",
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<Filters>({});
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const updateFilters = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilter = (key: keyof Filters) => {
    const { [key]: _, ...rest } = filters;
    setFilters(rest);
    onFiltersChange(rest);
    if (key === 'minPrice') setMinPriceInput("");
    if (key === 'maxPrice') setMaxPriceInput("");
  };

  const handlePriceInput = (value: string, type: 'min' | 'max') => {
    const numValue = value === "" ? "" : parseFloat(value);
    if (type === 'min') {
      setMinPriceInput(value);
      updateFilters({ minPrice: numValue === "" ? undefined : numValue });
    } else {
      setMaxPriceInput(value);
      updateFilters({ maxPrice: numValue === "" ? undefined : numValue });
    }
  };

  return (
    <Card className={`${className} animate-in slide-in-from-left-5`}>
      <CardHeader>
        <CardTitle>Фильтры</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Категория</label>
          <Select
            value={filters.categoryId?.toString()}
            onValueChange={(value) =>
              updateFilters({ categoryId: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
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
          {filters.categoryId && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 w-fit cursor-pointer"
              onClick={() => clearFilter("categoryId")}
            >
              {categories.find((c) => c.id === filters.categoryId)?.name}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Бренд</label>
          <Select
            value={filters.brandId?.toString()}
            onValueChange={(value) =>
              updateFilters({ brandId: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите бренд" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem
                  key={brand.id}
                  value={brand.id.toString()}
                >
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.brandId && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 w-fit cursor-pointer"
              onClick={() => clearFilter("brandId")}
            >
              {brands.find((b) => b.id === filters.brandId)?.name}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Диапазон цен</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="От"
              value={minPriceInput}
              onChange={(e) => handlePriceInput(e.target.value, 'min')}
              className="w-full"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="До"
              value={maxPriceInput}
              onChange={(e) => handlePriceInput(e.target.value, 'max')}
              className="w-full"
            />
          </div>
          {(filters.minPrice || filters.maxPrice) && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 w-fit cursor-pointer"
              onClick={() => {
                clearFilter("minPrice");
                clearFilter("maxPrice");
              }}
            >
              {filters.minPrice?.toLocaleString('ru-RU')} ₸ -{" "}
              {filters.maxPrice?.toLocaleString('ru-RU')} ₸
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Минимальный рейтинг</label>
          <Select
            value={filters.minRating?.toString()}
            onValueChange={(value) =>
              updateFilters({ minRating: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите минимальный рейтинг" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} ⭐ и выше
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.minRating && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 w-fit cursor-pointer"
              onClick={() => clearFilter("minRating")}
            >
              {filters.minRating} ⭐ и выше
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}