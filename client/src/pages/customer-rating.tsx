import { useState } from "react";
import { useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerRating() {
  const { orderId } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Avaliação enviada com sucesso!" });
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erro ao enviar avaliação" });
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card data-testid="card-rating-form">
        <CardHeader>
          <CardTitle>Avaliar Pedido #{orderId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Qual sua avaliação?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  data-testid={`button-star-${star}`}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p data-testid="text-rating-value" className="text-sm text-muted-foreground">
                {rating}/5 estrelas
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comentário (opcional)</label>
            <Textarea
              placeholder="Conte sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              data-testid="textarea-comment"
              className="min-h-24"
            />
          </div>

          {/* Submit Button */}
          <Button
            data-testid="button-submit-rating"
            onClick={() => submitRatingMutation.mutate()}
            disabled={rating === 0 || submitRatingMutation.isPending}
            className="w-full"
          >
            {submitRatingMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
