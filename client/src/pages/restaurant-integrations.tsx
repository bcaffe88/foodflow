import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Check, AlertCircle, Settings } from "lucide-react";

interface Integration {
  id: string;
  platform: string;
  isActive: boolean;
  externalId?: string;
  lastSyncedAt?: string;
}

export default function RestaurantIntegrations() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [accessToken, setAccessToken] = useState("");
  const [externalId, setExternalId] = useState("");

  const { data: integrations, isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/restaurant/integrations"],
  });

  const addIntegration = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/restaurant/integrations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/restaurant/integrations"],
      });
      toast({ title: "✓ Integração adicionada" });
      setShowAddForm(false);
      setAccessToken("");
      setExternalId("");
      setSelectedPlatform("");
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar integração",
        variant: "destructive",
      });
    },
  });

  const platforms = [
    { id: "ifood", name: "iFood", icon: "🍕", color: "from-red-500 to-red-600" },
    { id: "ubereats", name: "UberEats", icon: "🚗", color: "from-black to-gray-800" },
    { id: "quero", name: "Quero Delivery", icon: "📦", color: "from-blue-500 to-blue-600" },
    { id: "pede_ai", name: "Pede Aí", icon: "📍", color: "from-yellow-500 to-yellow-600" },
  ];

  const handleAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform || !accessToken) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    addIntegration.mutate({
      platform: selectedPlatform,
      accessToken,
      externalId: externalId || "",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações Externas</h1>
        <p className="text-muted-foreground mt-2">
          Conecte sua pizzaria com plataformas de delivery
        </p>
      </div>

      {/* Active Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((platform) => {
          const integration = integrations?.find(
            (i) => i.platform === platform.id
          );
          return (
            <Card
              key={platform.id}
              className={`p-6 border-2 ${
                integration?.isActive
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-gray-200 dark:border-gray-800"
              }`}
              data-testid={`card-integration-${platform.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{platform.icon}</div>
                  {integration?.isActive && (
                    <Check className="h-6 w-6 text-green-600" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">{platform.name}</h3>
                  {integration?.externalId && (
                    <p className="text-sm text-muted-foreground">
                      ID: {integration.externalId}
                    </p>
                  )}
                </div>

                {integration?.isActive && integration.lastSyncedAt && (
                  <p className="text-xs text-muted-foreground">
                    Último sync: {new Date(integration.lastSyncedAt).toLocaleString("pt-BR")}
                  </p>
                )}

                <div className="flex gap-2">
                  {integration?.isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      data-testid={`button-manage-${platform.id}`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlatform(platform.id);
                        setShowAddForm(true);
                      }}
                      data-testid={`button-add-${platform.id}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Integration Form */}
      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Adicionar{" "}
            {platforms.find((p) => p.id === selectedPlatform)?.name ||
              "Integração"}
          </h2>

          <form onSubmit={handleAddIntegration} className="space-y-4">
            <div>
              <Label htmlFor="accessToken">
                Token de Acesso / API Key
              </Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Seu token de acesso"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                data-testid="input-access-token"
                className="mt-2"
              />
            </div>

            {selectedPlatform === "quero" && (
              <div>
                <Label htmlFor="placeId">ID do Estabelecimento</Label>
                <Input
                  id="placeId"
                  placeholder="ID do estabelecimento na Quero Delivery"
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  data-testid="input-place-id"
                  className="mt-2"
                />
              </div>
            )}

            {selectedPlatform === "pede_ai" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Pede Aí possui API privada. Entre em contato com suporte:
                    <a
                      href="https://painel.pede.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      {" "}
                      painel.pede.ai
                    </a>
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={addIntegration.isPending}
                data-testid="button-submit-integration"
              >
                {addIntegration.isPending ? "Conectando..." : "Conectar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Information */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Como obter tokens de acesso?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>iFood:</strong> Vá para{" "}
            <a
              href="https://business.ifood.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Painel iFood
            </a>{" "}
            → Integrações
          </li>
          <li>
            <strong>UberEats:</strong> Vá para{" "}
            <a
              href="https://partners.ubereats.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Partner Portal
            </a>{" "}
            → Desenvolvedor
          </li>
          <li>
            <strong>Quero Delivery:</strong> Vá para{" "}
            <a
              href="https://api.quero.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Documentação Quero API
            </a>
          </li>
        </ul>
      </Card>
    </div>
  );
}
