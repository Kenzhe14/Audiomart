import { Review, insertReviewSchema } from "@shared/schema";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { StarIcon } from "lucide-react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Form } from "./form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ProductReviews({ productId }: { productId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWritingReview, setIsWritingReview] = useState(false);

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/products/${productId}/reviews`],
  });

  const form = useForm({
    resolver: zodResolver(insertReviewSchema),
    defaultValues: {
      productId,
      rating: 5,
      comment: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: Omit<Review, "id" | "userId" | "createdAt">) => {
      const res = await apiRequest("POST", `/api/products/${productId}/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      setIsWritingReview(false);
      form.reset();
      toast({
        title: "Отзыв добавлен",
        description: "Спасибо за ваш отзыв!",
      });
    },
  });

  const averageRating = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Отзывы</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} отзывов • Средняя оценка: {averageRating}
          </p>
        </div>
        {user && !isWritingReview && (
          <Button onClick={() => setIsWritingReview(true)}>
            Написать отзыв
          </Button>
        )}
      </div>

      {isWritingReview && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createReviewMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant={form.watch("rating") >= rating ? "default" : "outline"}
                  size="icon"
                  onClick={() => form.setValue("rating", rating)}
                >
                  <StarIcon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Textarea
              {...form.register("comment")}
              placeholder="Напишите ваш отзыв..."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWritingReview(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
              >
                Отправить
              </Button>
            </div>
          </form>
        </Form>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
