"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import type { RequestData } from "@/lib/firestore";
import { getRequestsForUser } from "@/lib/firestore";
import { DocumentSnapshot, DocumentData } from "firebase/firestore";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<RequestData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Estados para controlar a paginação
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
      // Opcional: Adicionar um toast de erro aqui
    } finally {
      setIsLoading(false);
    }
  }, [user]); // A dependência principal é o 'user'

  // useEffect para a carga inicial dos dados
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
    // O cursor para voltar para a pág anterior é o que inicia aquela página
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
  
  // A função de clique de exemplo foi removida pois não era utilizada.

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
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="hidden md:table-cell">Finalidade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando suas requisições...</TableCell></TableRow>
                  ) : requests.length > 0 ? (
                    requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {format(new Date(request.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
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
                        <TableCell className="hidden md:table-cell">{request.purpose || "N/A"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusVariant(request.status)}>
                            {translateStatus(request.status)}
                          </Badge>
                          {request.status === 'rejected' && request.rejectionReason && (
                            <Tooltip>
                               <TooltipTrigger>
                                  <p className="text-xs text-muted-foreground underline decoration-dashed cursor-pointer mt-1">
                                      Ver motivo
                                  </p>
                               </TooltipTrigger>
                               <TooltipContent>
                                   <p className="max-w-xs">{request.rejectionReason}</p>
                               </TooltipContent>
                           </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma requisição encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
      </div>
    </TooltipProvider>
  );
}