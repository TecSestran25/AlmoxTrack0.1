"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import type { RequestData } from "@/lib/firestore";
import { getRequestsForUser } from "@/lib/firestore";
import { DocumentSnapshot, DocumentData } from "firebase/firestore";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
    Pagination, 
    PaginationContent, 
    PaginationItem, 
    PaginationNext, 
    PaginationPrevious 
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Estados da Paginação
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageCursors, setPageCursors] = React.useState<(DocumentSnapshot<DocumentData> | undefined)[]>([undefined]);
  const [hasNextPage, setHasNextPage] = React.useState(true);
  const PAGE_SIZE = 5;

  const fetchRequests = React.useCallback(async (page: number, cursor?: DocumentSnapshot<DocumentData>) => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const { requests: data, lastDoc } = await getRequestsForUser(user.uid, PAGE_SIZE, cursor);
      setRequests(data);
      setHasNextPage(data.length === PAGE_SIZE);
      if (lastDoc) {
        setPageCursors(prev => {
          const newCursors = [...prev];
          newCursors[page] = lastDoc;
          return newCursors;
        });
      }
    } catch (error) {
      console.error("Erro ao buscar requisições:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user?.uid) {
      fetchRequests(1, undefined);
    }
  }, [user, fetchRequests]);

  const handleNextPage = () => {
    if (!hasNextPage) return;
    const nextPage = currentPage + 1;
    const cursor = pageCursors[currentPage];
    fetchRequests(nextPage, cursor);
    setCurrentPage(nextPage);
  };

  const handlePreviousPage = () => {
    if (currentPage === 1) return;
    const prevPage = currentPage - 1;
    const cursor = pageCursors[prevPage - 1]; 
    fetchRequests(prevPage, cursor);
    setCurrentPage(prevPage);
  };

  const getStatusVariant = (status: RequestData['status']) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };
  
  const translateStatus = (status: RequestData['status']) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'pending':
      default:
        return 'Pendente';
    }
  }

  const StatusBadge = ({ request }: { request: RequestData }) => {
    if (request.status === 'rejected' && request.rejectionReason) {
        return (
            <Dialog>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Badge variant={getStatusVariant(request.status)} className="cursor-pointer">
                            {translateStatus(request.status)}
                            </Badge>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Clique para ver o motivo</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Motivo da Rejeição</DialogTitle>
                    <DialogDescription className="pt-4 text-base text-foreground">
                        {request.rejectionReason}
                    </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }
    return (
        <Badge variant={getStatusVariant(request.status)}>
            {translateStatus(request.status)}
        </Badge>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Requisições</h1>
            <p className="text-muted-foreground">
                Acompanhe o andamento de todas as suas solicitações de materiais.
            </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Solicitações</CardTitle>
          </CardHeader>
          <CardContent>
            {/* --- VISUALIZAÇÃO PARA DESKTOP (TABELA) --- */}
            {/* A classe `hidden md:block` esconde isso em telas pequenas e mostra em médias/grandes */}
            <div className="hidden md:block border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Finalidade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando...</TableCell></TableRow>
                  ) : requests.length > 0 ? (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(new Date(request.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="underline decoration-dashed cursor-pointer">
                                {request.items.length} item(s)
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <ul>
                                {request.items.map(item => (
                                  <li key={item.id}>- {item.quantity} {item.unit}(s) de {item.name}</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{request.purpose || "N/A"}</TableCell>
                        <TableCell className="text-center">
                          <StatusBadge request={request} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma requisição encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* --- VISUALIZAÇÃO PARA MOBILE (CARDS) --- */}
            {/* A classe `md:hidden` mostra isso em telas pequenas e esconde em médias/grandes */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="text-center text-muted-foreground p-4">Carregando...</div>
              ) : requests.length > 0 ? (
                requests.map((request) => (
                    <Card key={request.id}>
                        <CardHeader>
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>
                                    {format(new Date(request.date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <StatusBadge request={request} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                             <div>
                                <strong>Itens: </strong>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <span className="underline decoration-dashed cursor-pointer text-primary">
                                            {request.items.length} item(s)
                                        </span>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Itens Solicitados</DialogTitle>
                                        </DialogHeader>
                                        <ul className="list-disc pl-5 pt-2 space-y-1">
                                            {request.items.map(item => (
                                            <li key={item.id}>{item.quantity} {item.unit}(s) de <strong>{item.name}</strong></li>
                                            ))}
                                        </ul>
                                    </DialogContent>
                                </Dialog>
                             </div>
                             <div>
                                <strong>Finalidade: </strong> {request.purpose || "N/A"}
                             </div>
                        </CardContent>
                    </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground p-4">Nenhuma requisição encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>
        { (requests.length > 0 || currentPage > 1) && (
            <Pagination>
                <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious 
                    onClick={handlePreviousPage} 
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                </PaginationItem>
                <PaginationItem>
                    <span className="p-2 text-sm font-medium">Página {currentPage}</span>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext 
                    onClick={handleNextPage}
                    className={!hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}
      </div>
    </TooltipProvider>
  );
}