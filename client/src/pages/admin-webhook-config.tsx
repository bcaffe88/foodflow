import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

const webhookConfigSchema = z.object({
  printerWebhookUrl: z.string().url("URL inválida").or(z.literal("")),
  printerWebhookEnabled: z.boolean().default(false),
  printerWebhookMethod: z.enum(["GET", "POST", "PUT"]).default("POST"),
});

type WebhookConfig = z.infer<typeof webhookConfigSchema>;

export default function AdminWebhookConfig() {
  const { toast } = useToast();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch webhook config
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/webhook/config"],
    queryFn: async () => {
      const res = await fetch("/api/webhook/config", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });

  const form = useForm<WebhookConfig>({
    resolver: zodResolver(webhookConfigSchema),
    defaultValues: {
      printerWebhookUrl: config?.printerWebhookUrl || "",
      printerWebhookEnabled: config?.printerWebhookEnabled || false,
      printerWebhookMethod: config?.printerWebhookMethod || "POST",
    },
    values: config ? {
      printerWebhookUrl: config.printerWebhookUrl || "",
      printerWebhookEnabled: config.printerWebhookEnabled || false,
      printerWebhookMethod: config.printerWebhookMethod || "POST",
    } : undefined,
  });

  // Save webhook config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: WebhookConfig) => {
      return apiRequest("/api/webhook/config", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuração salva",
        description: "Webhook configurado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webhook/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete webhook config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/webhook/config", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Webhook removido",
        description: "Configuração deletada com sucesso",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/webhook/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test webhook
  const handleTestWebhook = async () => {
    const url = form.getValues("printerWebhookUrl");
    if (!url) {
      toast({
        title: "URL não configurada",
        description: "Salve a configuração primeiro",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast({
          title: "Webhook funcionando",
          description: `Status: ${data.status}`,
        });
      } else {
        toast({
          title: "Webhook não respondeu",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar webhook",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-webhook-config-title">
          Configuração de Webhook - Impressora
        </h1>
        <p className="text-muted-foreground mb-6" data-testid="text-webhook-description">
          Configure onde enviar notificações de pedidos para sua impressora térmica
        </p>

        <Card className="p-6 space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => saveConfigMutation.mutate(data))}
              className="space-y-4"
            >
              {/* URL Input */}
              <FormField
                control={form.control}
                name="printerWebhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Webhook</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://sua-impressora.local:8080/api/orders"
                        {...field}
                        data-testid="input-webhook-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Method Select */}
              <FormField
                control={form.control}
                name="printerWebhookMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método HTTP</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        data-testid="select-webhook-method"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Enable Toggle */}
              <FormField
                control={form.control}
                name="printerWebhookEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Ativar Webhook</FormLabel>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4"
                      data-testid="checkbox-webhook-enabled"
                    />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  data-testid="button-save-webhook"
                >
                  {saveConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configuração"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestWebhook}
                  disabled={testLoading || !form.getValues("printerWebhookUrl")}
                  data-testid="button-test-webhook"
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    "Testar Webhook"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteConfigMutation.mutate()}
                  disabled={deleteConfigMutation.isPending || !config?.printerWebhookUrl}
                  data-testid="button-delete-webhook"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </Button>
              </div>
            </form>
          </Form>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
              data-testid="div-webhook-result"
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p
                    className={
                      testResult.success ? "text-green-900 font-semibold" : "text-red-900 font-semibold"
                    }
                    data-testid="text-webhook-status"
                  >
                    {testResult.message}
                  </p>
                  {testResult.response && (
                    <p className={testResult.success ? "text-green-700 text-sm" : "text-red-700 text-sm"}>
                      Status: {testResult.response.statusCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="div-webhook-info">
            <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Quando um pedido fica pronto, um webhook é enviado para sua URL</li>
              <li>A impressora recebe os detalhes e imprime automaticamente</li>
              <li>Use a autenticação HTTP básica se necessário</li>
              <li>Testamos a URL antes de ativar</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
