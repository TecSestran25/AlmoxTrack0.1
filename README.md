# 📦 AlmoxTrack

**AlmoxTrack** é um sistema web desenvolvido para gerenciar as operações de almoxarifado da **Secretaria de Segurança Cidadã e Trânsito (SESTRAN)** da Prefeitura Municipal de Goiana - PE.  
Seu principal objetivo é digitalizar o controle de estoque, registrar movimentações e gerenciar solicitações de materiais feitas pelos diversos setores.

---

## 🧭 Sumário
- [1. Propósito](#1-propósito)
- [2. Escopo](#2-escopo)
- [3. Público-Alvo](#3-público-alvo)
- [4. Tecnologias](#4-tecnologias)
- [5. Arquitetura](#5-arquitetura)
- [6. Funcionalidades Principais](#6-funcionalidades-principais)
- [7. Guia do Usuário](#7-guia-do-usuário)
- [8. Guia de Instalação e Configuração (Desenvolvedor)](#8-guia-de-instalação-e-configuração-desenvolvedor)
- [9. Estrutura do Banco de Dados](#9-estrutura-do-banco-de-dados)
- [10. Licença](#10-licença)

---

## 1. Propósito
O **AlmoxTrack** é um sistema de software voltado ao controle de estoque e movimentações de materiais da SESTRAN.  
Permite registrar entradas, saídas, devoluções e requisições, com autenticação e controle de acesso por papéis.

---

## 2. Escopo
Funcionalidades principais:
- Controle de inventário (materiais de consumo e permanentes)
- Registro de entradas, saídas e devoluções
- Requisições de materiais e aprovação/rejeição
- Geração de Termos de Responsabilidade (PDF)
- Dashboard com estatísticas e gráficos
- Exportação de dados em CSV
- Autenticação e autorização baseada em papéis

---

## 3. Público-Alvo
| Perfil | Permissões |
|--------|-------------|
| **Administrador** | Acesso total, gerenciamento de itens, requisições e dashboard |
| **Operador** | Registro de entradas, saídas, devoluções e aprovação de requisições |
| **Requisitante** | Solicitação de materiais e acompanhamento de requisições |

---

## 4. Tecnologias

### Frontend
- Next.js (React + App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Hook Form + Zod
- Recharts

### Backend & Banco de Dados
- Firebase Authentication  
- Cloud Firestore (NoSQL)
- Cloudinary (hospedagem de imagens)
- jsPDF + jspdf-autotable (PDFs)

---

## 5. Arquitetura

O **AlmoxTrack** é uma aplicação **Next.js** que utiliza o **Firebase** como BaaS.  
A arquitetura segue o padrão de separação entre frontend (UI/UX) e serviços backend (auth, database, storage).

```
src/
 ├── app/              # Rotas principais (App Router)
 ├── api/              # Rotas de API (upload, etc.)
 ├── components/       # Componentes reutilizáveis
 ├── contexts/         # Contextos globais (AuthContext)
 ├── hooks/            # Hooks customizados
 ├── lib/              # Lógica de negócios e utilitários
 ├── public/           # Arquivos estáticos
 └── ai/               # Integrações com Google AI
```

---

## 6. Funcionalidades Principais

### 🔐 Autenticação e Autorização
- Login com Firebase Authentication
- Controle de acesso por **papel** e **secretariaId**
- Regras de segurança no Firestore

### 📊 Dashboard
- Gráficos com Recharts
- Indicadores e filtros por período, tipo de material, setor
- Exportação CSV

### 📦 Inventário
- CRUD completo de produtos (Admin)
- Histórico de movimentações
- Alertas de validade para perecíveis

### ➕ Entrada / ➖ Saída / 🔁 Devolução
- Registro com transações Firestore
- Tipos: oficial, consumo, permanente
- Geração de PDF (Termo de Responsabilidade)

### 📝 Requisições
- Solicitação de materiais por setor
- Aprovação/Rejeição por operadores
- Notificações em tempo real (toasts e som)

---

## 7. Guia do Usuário

### Login
1. Acesse `/login`
2. Informe email e senha
3. Clique em **Entrar**

### Navegação
- Menu lateral adaptável por papel
- Tema Claro/Escuro configurável
- Logout via menu do usuário

### Ações Principais
- **Inventário:** adicionar, editar, excluir e visualizar produtos  
- **Entradas/Saídas/Devoluções:** registrar movimentações  
- **Requisições:** criar e acompanhar solicitações  

---

## 8. Guia de Instalação e Configuração (Desenvolvedor)

### 🧩 Pré-requisitos
- Node.js (versão LTS)
- npm ou yarn

### 🔧 Configuração
1. Crie um projeto no **Firebase**
2. Ative **Authentication** e **Firestore**
3. Configure regras de segurança (`firestore.rules`)
4. Crie conta no **Cloudinary** e gere credenciais

### ⚙️ Variáveis de Ambiente (`.env.local`)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 🚀 Instalação
```bash
git clone <url_do_repositorio>
cd almoxtrack
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 9. Estrutura do Banco de Dados (Firestore)

### Coleções Principais
- **users:** dados do usuário, role e secretariaId  
- **products:** catálogo de itens  
- **movements:** histórico de entradas, saídas e devoluções  
- **requests:** solicitações de materiais  

### Segurança
As regras garantem acesso apenas aos dados da **secretariaId** correspondente ao usuário logado.

---

## 10. Licença
Este projeto é de uso interno da **Prefeitura Municipal de Goiana - PE / SESTRAN**.  
Distribuição e modificação restritas conforme autorização da administração responsável.

---

📘 **Desenvolvido por:** Equipe de TI - SESTRAN  
🛠️ **Tecnologias:** Next.js | Firebase | Cloudinary | Tailwind | TypeScript
