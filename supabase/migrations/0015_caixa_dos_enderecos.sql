-- ============================================================
-- A caixa de dois enderecos
-- ============================================================
-- Apareceu na tela nova do estabelecimento: o Brasa saia como
-- "avenida presidente lucena, 1243, bom jardim", tudo em minusculas. Nao era
-- o layout — estava assim no banco desde o cadastro.
--
-- Conferi as quinze linhas com endereco antes de mexer, e so DUAS estavam
-- erradas. Por isso a correcao e nominal, e nao uma funcao de maiusculas
-- passando em tudo: initcap() em portugues estraga mais do que conserta.
-- "Rua da Feitoria" viraria "Rua Da Feitoria", "Em frente a Prefeitura
-- Municipal" viraria "Em Frente A Prefeitura Municipal", e as treze linhas
-- que estavam certas ficariam erradas.
--
-- Prevenir de vez pediria normalizar na hora de salvar, no painel — e ali
-- esbarra no mesmo problema: nao da para uma regra saber que "da" e "do"
-- ficam minusculos no meio e maiusculos no comeco sem uma lista de excecoes
-- que tambem erra. Por enquanto o certo e o comerciante digitar direito, e
-- este arquivo conserta o que ja entrou torto.
-- ============================================================

update public.locais
   set endereco = 'Avenida Presidente Lucena',
       bairro   = 'Bom Jardim'
 where slug = 'brasa-pizzaria-e-restaurante'
   and endereco = 'avenida presidente lucena';

update public.locais
   set bairro = 'Vista Alegre'
 where slug = 'beeis-burger-e-brasa'
   and bairro = 'Vista alegre';
