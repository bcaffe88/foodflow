import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryTabsProps) {
  if (!categories.length) return null;

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {categories.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  variant="ghost"
                  className={`relative rounded-none border-b-4 transition-all ${
                    isActive
                      ? "border-red-600 text-red-600 font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onCategoryClick(category.id)}
                  data-testid={`button-category-${category.id}`}
                >
                  {category.name}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
