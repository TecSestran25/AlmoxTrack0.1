"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getPendingRequests, rejectRequest, RequestData } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function RequestsManagementPage() {
    const [pendingRequests, setPendingRequests] = React.useState<RequestData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState("");
    const [requestToReject, setRequestToReject] = React.useState<RequestData | null>(null);
    
    const { user, secretariaId } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const fetchRequests = React.useCallback(async () => {
        if (!secretariaId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const requests = await getPendingRequests(secretariaId);
            setPendingRequests(requests);
        } catch (error: any) {
            toast({
                title: "Erro ao carregar requisições",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, secretariaId]);

    React.useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApproveAndRedirect = (request: RequestData) => {
        setIsProcessing(request.id);
        try {
            const exitData = {
                requester: request.requester,
                department: request.department,
                purpose: request.purpose,
                items: request.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    quantity: item.quantity,
                    unit: item.unit,
                    isPerishable: item.isPerishable,
                    expirationDate: item.expirationDate,
                })),
            };

            const encodedData = btoa(JSON.stringify(exitData));
            const firstItemType = request.items[0]?.type || 'consumo';
            const tabToOpen = firstItemType === 'permanente' ? 'responsibility' : 'consumption';

            router.push(`/dashboard/exit?tab=${tabToOpen}&requestData=${encodedData}&requestId=${request.id}`);

        } catch (error: any) {
            toast({ title: "Erro ao preparar dados", description: error.message, variant: "destructive" });
            setIsProcessing(null);
        }
    };

    const handleReject = async (requestId: string, reason: string) => {
        if (!user?.email || !secretariaId) {
            toast({ title: "Erro de autenticação", variant: "destructive" });
            return;
        }

        if (!reason || !reason.trim()) {
            toast({ title: "Motivo obrigatório", variant: "destructive" });
            return;
        }

        setIsProcessing(requestId);
        try {
            await rejectRequest(secretariaId, requestId, user.email, reason);

            toast({ title: "Requisição Rejeitada!", variant: "default" });
            setRequestToReject(null);
            setRejectionReason("");
            fetchRequests();

        } catch (error: any) {
            toast({ title: "Erro ao Rejeitar", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(null);
        }
    };
    
    return (
        <TooltipProvider>
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Requisições Pendentes</CardTitle>
                            <CardDescription className="mt-2">Gerencie as solicitações de materiais de consumo.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block border rounded-md overflow-x-auto max-h-[70vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Departamento</TableHead>
                                        <TableHead>Itens</TableHead>
                                        <TableHead>Finalidade</TableHead>
                                        <TableHead className="w-[150px] text-center">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">Carregando...</TableCell>
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
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                        <span className="underline decoration-dashed cursor-pointer">
                                                            {request.items.length} item(s)
                                                        </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                        <ul className="list-disc pl-4">
                                                            {request.items.map(item => (
                                                            <li key={item.id}>- {item.quantity} {item.unit}(s) de {item.name}</li>
                                                            ))}
                                                        </ul>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {request.purpose || "N/A"}
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{request.purpose || "N/A"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="text-center space-x-2">
                                                    {/* Botões Desktop (ícones) */}
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
                                                        onClick={() => setRequestToReject(request)} 
                                                        disabled={isProcessing === request.id}
                                                    >
                                                        {isProcessing === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                Nenhuma requisição pendente.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="md:hidden space-y-4">
                        {isLoading ? (
                            <div className="text-center text-muted-foreground p-4">Carregando...</div>
                        ) : pendingRequests.length > 0 ? (
                            pendingRequests.map((request) => (
                                <Card key={request.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base flex justify-between items-center">
                                            <span>
                                                {format(new Date(request.date), "dd/MM/yyyy", { locale: ptBR })}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground space-y-2">
                                        <div>
                                            <strong>Solicitante: </strong> {request.requester}
                                        </div>
                                        <div>
                                            <strong>Setor: </strong> {request.department}
                                        </div>
                                        <div>
                                            <strong>Itens: </strong>
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <span className="underline decoration-dashed cursor-pointer text-primary">
                                                        {request.items.length} item(s)
                                                    </span>
                                                </SheetTrigger>
                                                <SheetContent side="bottom">
                                                    <SheetHeader>
                                                        <SheetTitle>Itens Solicitados</SheetTitle>
                                                        <SheetDescription>
                                                        Requisição de {request.requester} em {format(new Date(request.date), "dd/MM/yyyy", { locale: ptBR })}.
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <ul className="list-disc pl-5 pt-4 space-y-2">
                                                        {request.items.map(item => (
                                                        <li key={item.id}>{item.quantity} {item.unit}(s) de <strong>{item.name}</strong></li>
                                                        ))}
                                                    </ul>
                                                </SheetContent>
                                            </Sheet>
                                        </div>
                                        <div>
                                            <strong>Finalidade: </strong> {request.purpose || "N/A"}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setRequestToReject(request)} 
                                            disabled={isProcessing === request.id}
                                        >
                                            {isProcessing === request.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                            ) : null}
                                            Recusar
                                        </Button>
                                        <Button
                                            variant="default" 
                                            size="sm" 
                                            onClick={() => handleApproveAndRedirect(request)}
                                            disabled={isProcessing === request.id}
                                        >
                                            {isProcessing === request.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Aprovar
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground p-4">Nenhuma requisição pendente.</div>
                        )}
                        </div>
                    </CardContent>
                </Card>
                <AlertDialog open={!!requestToReject} onOpenChange={(isOpen) => !isOpen && setRequestToReject(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rejeitar Requisição</AlertDialogTitle>
                            <AlertDialogDescription>
                                Por favor, informe o motivo da rejeição. Esta informação será visível para o solicitante.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                            placeholder="Ex: Estoque insuficiente, item fora de linha, etc."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRequestToReject(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleReject(requestToReject!.id, rejectionReason)}
                                disabled={!rejectionReason.trim()}
                            >
                                Confirmar Rejeição
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}