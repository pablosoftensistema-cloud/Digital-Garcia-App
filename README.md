# Garcia Digital — CRM comercial

Painel inicial para organizar leads, pipeline comercial e orçamentos da Garcia Digital.

## Recursos
- Dashboard com contadores de leads, negociação, orçamentos e valor de propostas
- Cadastro/edição/exclusão de leads
- Status comercial, serviço de interesse, origem e data de acompanhamento
- Busca e filtros
- Cadastro/edição/exclusão de orçamentos
- Visualização e impressão de orçamento
- Exportação e importação de backup JSON
- Layout responsivo para celular e desktop

## Rodar localmente
Abra `index.html` no navegador. Não exige instalação nem build.

## Publicar no GitHub + Vercel
1. Crie um repositório GitHub chamado `garcia-digital-crm`.
2. Envie todos os arquivos deste projeto para a raiz do repositório.
3. No Vercel, selecione **Add New → Project** e importe o repositório.
4. Para este site estático, deixe Build Command e Output Directory vazios/padrão e clique em Deploy.
5. Depois de conectar Git, cada push para a branch de produção (normalmente `main`) gera um novo deploy automaticamente.

## Limitação importante desta versão
Os dados são salvos em `localStorage` no navegador atual. Isso serve para protótipo e demonstração, mas não é uma solução multiusuário: não sincroniza entre computadores, não tem login, controle de acesso ou banco central. Antes de usar com dados reais de clientes, conectar um backend (por exemplo, Supabase), configurar autenticação e políticas de acesso, e validar segurança/backup. Não armazene senhas ou dados sensíveis nesta versão.
