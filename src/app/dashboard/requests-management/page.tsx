"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getPendingRequests, approveRequest, rejectRequest, RequestData } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function RequestsManagementPage() {
    const [pendingRequests, setPendingRequests] = React.useState<RequestData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const fetchRequests = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const requests = await getPendingRequests();
            setPendingRequests(requests);
        } catch (error) {
            toast({
                title: "Erro ao carregar requisições",
                description: "Não foi possível buscar as requisições pendentes.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApproveAndRedirect = async (request: RequestData) => {
        if (!user || !user.email) {
            toast({ title: "Erro de autenticação", description: "Operador não identificado.", variant: "destructive" });
            return;
        }

        setIsProcessing(request.id);
        try {
            await approveRequest(request.id, user.email);
            const exitData = {
                requester: request.requester,
                department: request.department,
                purpose: request.purpose,
                items: request.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    isPerishable: item.isPerishable,
                    expirationDate: item.expirationDate,
                })),
            };

            const encodedData = btoa(JSON.stringify(exitData));
            router.push(`/dashboard/exit?requestData=${encodedData}`);

        } catch (error: any) {
            toast({ title: "Erro ao Aprovar", description: error.message || "Tente novamente mais tarde.", variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!user || !user.email) {
            toast({ title: "Erro de autenticação", description: "Operador não identificado.", variant: "destructive" });
            return;
        }

        setIsProcessing(requestId);
        try {
            await rejectRequest(requestId, user.email);
            toast({ title: "Requisição Rejeitada!", description: "A requisição foi movida para o status de rejeitada.", variant: "default" });
            fetchRequests();
        } catch (error) {
            toast({ title: "Erro ao Rejeitar", description: "Não foi possível rejeitar a requisição.", variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Requisições Pendentes</CardTitle>
                    <CardDescription>Gerencie as solicitações de materiais de consumo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto max-h-[70vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Solicitante</TableHead>
                                    <TableHead>Departamento</TableHead>
                                    <TableHead>Itens</TableHead>
                                    <TableHead className="w-[150px] text-center">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell>
                                    </TableRow>
                                ) : pendingRequests.length > 0 ? (
                                    pendingRequests.map(request => (
                                        <TableRow key={request.id}>
                                            <TableCell>{format(parseISO(request.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{request.requester}</div>
                                            </TableCell>
                                            <TableCell>{request.department}</TableCell>
                                            <TableCell>
                                                <ul className="list-disc pl-4">
                                                    {request.items.map(item => (
                                                        <li key={item.id}>
                                                            {item.name} ({item.quantity} {item.unit})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell className="text-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:bg-green-100"
                                                    onClick={() => handleApproveAndRedirect(request)}
                                                    disabled={isProcessing === request.id}
                                                >
                                                    {isProcessing === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600 hover:bg-red-100"
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={isProcessing === request.id}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Nenhuma requisição pendente.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}