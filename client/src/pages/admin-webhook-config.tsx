import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminWebhookConfig() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
            data-testid="button-back-admin"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-xl font-bold">Configuração de Webhooks</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="space-y-4">
          {/* Info Alert */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 className="font-semibold text-blue-900 dark:text-blue-100">
                  Webhooks Configurados por Restaurante
                </h2>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Webhooks de impressora, n8n e integrações agora são gerenciados por cada restaurante individualmente.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Para configurar, vá para <strong>Gerenciar Restaurantes</strong> e selecione um restaurante para editar seus webhooks.
                </p>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="p-4 md:p-6 space-y-4">
            <h3 className="font-semibold text-base md:text-lg">Como configurar webhooks</h3>
            <ol className="space-y-2 text-sm md:text-base list-decimal list-inside text-muted-foreground">
              <li>Vá para <strong>Gerenciar Restaurantes</strong> no Admin Dashboard</li>
              <li>Selecione o restaurante desejado</li>
              <li>Clique em <strong>Editar</strong> para configurar webhooks</li>
              <li>Configure URL de webhook n8n, impressora TCP/IP e outras integrações</li>
              <li>Salve as alterações</li>
            </ol>
          </Card>
        </div>
      </main>
    </div>
  );
}
